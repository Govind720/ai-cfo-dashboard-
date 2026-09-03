import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

async function callGemini(messages: Array<{ role: string; content: string }>) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured (missing API key).");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit reached. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up to continue.");
    throw new Error(`AI request failed (${res.status}). ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

const CategorizeInput = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        vendor: z.string(),
        amount: z.number(),
        type: z.string(),
      }),
    )
    .max(120),
  categories: z.array(z.string()),
});

export const categorizeTransactions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CategorizeInput.parse(input))
  .handler(async ({ data }) => {
    if (!data.items.length) return { results: [] as Array<{ id: string; category: string }> };

    const prompt = `You are a finance controller for an Indian startup. Assign one expense/income category to each transaction.
Prefer these existing categories when they fit: ${data.categories.join(", ") || "(none yet)"}.
Otherwise create a concise, standard category name (e.g. Salaries, Cloud Infrastructure, Marketing, Taxes, Payment Processing, Software, Rent, Travel, Insurance, Legal & Compliance, Revenue).

Transactions:
${data.items.map((t) => `${t.id} | ${t.type} | ${t.vendor} | ${t.description} | INR ${t.amount}`).join("\n")}

Reply with ONLY a JSON array: [{"id":"<id>","category":"<category>"}]`;

    const raw = await callGemini([
      { role: "system", content: "You return strict JSON only, with no markdown fences." },
      { role: "user", content: prompt },
    ]);

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return { results: [] as Array<{ id: string; category: string }> };
    try {
      const parsed = JSON.parse(match[0]) as Array<{ id?: string; category?: string }>;
      return {
        results: parsed
          .filter((r) => r.id && r.category)
          .map((r) => ({ id: String(r.id), category: String(r.category) })),
      };
    } catch {
      return { results: [] as Array<{ id: string; category: string }> };
    }
  });

const AskInput = z.object({
  question: z.string().min(1).max(2000),
  summary: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .default([]),
});

export const askCfo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => {
    const system = `You are the AI CFO of an Indian startup. Answer like an experienced finance controller: direct, quantitative, and decisive.
Rules:
- Always cite specific numbers from the financial context (amounts in INR, use lakh/crore phrasing where natural).
- Explain drivers (which category/vendor/month caused a change) and quantify the delta and %.
- Finish with a short "Recommendation:" line when relevant.
- Keep answers under 200 words. Use markdown-free plain text with short lines or "-" bullets.
- If the data does not cover the question, say exactly what is missing.

FINANCIAL CONTEXT:
${data.summary}`;

    const answer = await callGemini([
      { role: "system", content: system },
      ...data.history,
      { role: "user", content: data.question },
    ]);
    return { answer: answer || "I couldn't generate an answer. Please try rephrasing." };
  });
