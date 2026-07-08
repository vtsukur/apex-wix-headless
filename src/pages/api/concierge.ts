// POST /api/concierge — the pit-wall radio: a Claude-driven booking concierge.
//
// The agentic loop runs server-side at Anthropic via the MCP connector
// (beta `mcp-client-2025-11-20`): Claude calls the site's own Wix Site MCP
// endpoint (search content, check availability, book on a visitor's behalf)
// without this route hand-rolling a tool loop. The route grounds the model
// with the live service catalog (same query as /llms.txt), then re-streams a
// simplified SSE protocol to the chat island:
//   data: {"type":"text","text":"..."}   incremental reply text
//   data: {"type":"tool","name":"..."}   an MCP tool call started (status line)
//   data: {"type":"error","message":"…"} terminal failure, friendly wording
//   data: {"type":"done"}                turn complete
// Missing ANTHROPIC_API_KEY degrades to a clean "off the air" error event so
// the widget never breaks the site. Set the key with:
//   wix env set --key ANTHROPIC_API_KEY --value <key>   (production)
//   wix env pull                                        (sync .env.local)
import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { services } from "@wix/bookings";
import { auth } from "@wix/essentials";

const BOOKING_APP_ID = "13d21c63-b5ec-5912-8397-c3a5ddb27a97";
const SITE_URL = "https://www.apex-drive.co";
const MCP_URL = `${SITE_URL}/_api/mcp`;
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 2000;
const MAX_CONTINUATIONS = 4; // pause_turn resumes (server-side tool loop cap)

// Live catalog block for the system prompt — cached briefly so a chatty
// session doesn't re-query Bookings on every turn (serverless module scope,
// best-effort).
let catalogCache: { text: string; at: number } | null = null;
async function catalogBlock(): Promise<string> {
  if (catalogCache && Date.now() - catalogCache.at < 5 * 60_000) {
    return catalogCache.text;
  }
  let text = `- The catalog is temporarily unavailable — send visitors to ${SITE_URL}/services for current sessions and prices.`;
  try {
    const result = await auth
      .elevate(services.queryServices)()
      .eq("appId", BOOKING_APP_ID)
      .limit(100)
      .find();
    const lines = ((result.items ?? []) as any[])
      .filter((s) => !s.hidden)
      .map((s) => {
        const slug = s.mainSlug?.name ?? s.supportedSlugs?.[0]?.name;
        if (!slug) return null;
        const duration = s.schedule?.availabilityConstraints?.sessionDurations?.[0];
        const p = s.payment;
        const price =
          p?.rateType === "FIXED" && p.fixed?.price?.value
            ? `${p.fixed.price.currency ?? "EUR"} ${Number(p.fixed.price.value)}`
            : "price on page";
        const tagline = (s.tagLine ?? "").trim();
        return `- ${s.name} — ${price}, ${duration ?? "?"} min — ${SITE_URL}/services/${slug}${tagline ? ` — ${tagline}` : ""}`;
      })
      .filter(Boolean);
    if (lines.length) text = lines.join("\n");
  } catch (err) {
    console.error("[concierge] catalog query failed:", err);
  }
  catalogCache = { text, at: Date.now() };
  return text;
}

function systemPrompt(catalog: string): string {
  const now = new Date().toLocaleString("en-IE", {
    timeZone: "Europe/Dublin",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `You are the APEX Concierge — the pit-wall radio operator for APEX (${SITE_URL}), a fictional supercar driving-experience outfit. Visitors radio in from the website; you help them pick a session and get it booked.

The catalog right now:
${catalog}

Site pages: ${SITE_URL}/services (all sessions), ${SITE_URL}/about (who we are), ${SITE_URL}/faq (requirements, 30% deposit, cancellation policy, what happens on the day).

You are connected to the site's own MCP tools (Wix Site MCP). Use them for anything live rather than guessing:
- SearchInSite for site content questions you can't answer from the catalog above.
- For real availability: SearchSiteApiDocs to learn the availability API, GenerateVisitorToken once, then CallWixSiteAPI. Report concrete options (weekday, date, time — Europe/Dublin) and keep it to the best few.
- GetBusinessDetails for business facts like timezone or contact details.

House rules:
- Radio style: short, confident, warm. One to three sentences per reply, plain prose — no headers, no bullet walls. A little pit-lane flavour is welcome; clarity comes first.
- Ground every claim in the catalog above or a tool result. Never invent sessions, cars, prices, or time slots.
- When you recommend a session, give its markdown link — booking is completed on that page (live calendar, instructor choice, checkout).
- Ask at most one clarifying question, and only when you genuinely can't recommend without it.
- Off-topic requests: steer back to the circuit, politely and briefly.
- APEX is a fictional marque; every car, circuit, and pass is an original design. Don't compare to or claim real-world brands.

Today is ${now} (Europe/Dublin).`;
}

type WireMessage = { role: "user" | "assistant"; content: string };

function validateMessages(body: unknown): WireMessage[] | null {
  const messages = (body as any)?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null;
  }
  const clean: WireMessage[] = [];
  for (const m of messages) {
    const role = m?.role;
    const content = m?.content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || !content.trim() || content.length > MAX_MESSAGE_CHARS) {
      return null;
    }
    clean.push({ role, content });
  }
  if (clean[0].role !== "user" || clean[clean.length - 1].role !== "user") return null;
  return clean;
}

const sse = (payload: object) => `data: ${JSON.stringify(payload)}\n\n`;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 });
  }
  const messages = validateMessages(body);
  if (!messages) {
    return new Response(JSON.stringify({ error: "invalid messages" }), { status: 400 });
  }

  const apiKey =
    import.meta.env.ANTHROPIC_API_KEY ??
    (globalThis as any).process?.env?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Graceful degrade — the widget shows this as a normal radio message.
    return new Response(
      sse({
        type: "error",
        message:
          "The concierge is off the air right now — radio checks are underway. Browse the sessions directly, every page has a live calendar.",
      }) + sse({ type: "done" }),
      { headers: SSE_HEADERS },
    );
  }

  const client = new Anthropic({ apiKey });
  const system = systemPrompt(await catalogBlock());

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: object) => controller.enqueue(encoder.encode(sse(payload)));
      const history: Anthropic.Beta.BetaMessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      try {
        // Server-side MCP tool loop can pause (`pause_turn`); resume by
        // appending the assistant turn and re-streaming, bounded.
        for (let hop = 0; hop <= MAX_CONTINUATIONS; hop++) {
          const runner = client.beta.messages.stream({
            model: "claude-opus-4-8",
            max_tokens: 2048,
            thinking: { type: "adaptive" },
            output_config: { effort: "low" },
            betas: ["mcp-client-2025-11-20"],
            system,
            mcp_servers: [{ type: "url", url: MCP_URL, name: "apex-site" }],
            tools: [{ type: "mcp_toolset", mcp_server_name: "apex-site" }],
            messages: history,
          });

          for await (const event of runner) {
            if (event.type === "content_block_start") {
              const block = (event as any).content_block;
              if (block?.type === "mcp_tool_use") {
                send({ type: "tool", name: block.name ?? "site lookup" });
              }
            } else if (event.type === "content_block_delta") {
              const delta = (event as any).delta;
              if (delta?.type === "text_delta" && delta.text) {
                send({ type: "text", text: delta.text });
              }
            }
          }

          const final = await runner.finalMessage();
          if (final.stop_reason !== "pause_turn") break;
          history.push({ role: "assistant", content: final.content });
        }
        send({ type: "done" });
      } catch (err) {
        console.error("[concierge] stream failed:", err);
        send({
          type: "error",
          message:
            "Lost the radio link mid-transmission — give it another go in a moment, or browse the sessions directly.",
        });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
};
