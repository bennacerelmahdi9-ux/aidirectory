/**
 * OpenRouter-powered tool draft generation: scrape the submitted website,
 * then ask a chat model to return structured fields for the submit form.
 *
 * Key and model are admin-configurable (DB settings) with env fallbacks.
 */

import { SETTING_KEYS, getSettings } from "@/lib/settings";

const FETCH_TIMEOUT_MS = 10_000;
const AI_TIMEOUT_MS = 30_000;

export type ToolDraft = {
  name: string;
  description: string;
  tags: string[];
  pricingModel: string;
  category: string;
};

async function aiConfig(): Promise<{ apiKey: string; model: string }> {
  const s = await getSettings();
  return {
    apiKey: s[SETTING_KEYS.openrouterApiKey] || "",
    model: s[SETTING_KEYS.openrouterModel] || "openai/gpt-4o-mini",
  };
}

/** Fetch a page and pull out title / meta description / visible text. */
async function scrapePage(url: string): Promise<{ title: string; metaDescription: string; text: string } | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: { "user-agent": "AIAtlas/1.0 (+https://aiatlas.dev)" },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const html = (await res.text()).slice(0, 300_000);

  const meta = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"))?.[1] ??
    "";

  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  // Strip scripts/styles/tags, collapse whitespace for a text summary.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  return { title, metaDescription: meta("description") || meta("og:description"), text };
}

function extractJson(raw: string): ToolDraft | null {
  // Tolerate models that wrap JSON in code fences or prose.
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<ToolDraft>;
    if (!parsed.name || !parsed.description) return null;
    const validPricing = new Set(["FREE", "FREEMIUM", "PAID", "CONTACT", "OPEN_SOURCE"]);
    return {
      name: String(parsed.name).slice(0, 100),
      description: String(parsed.description).slice(0, 400),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : [],
      pricingModel: validPricing.has(String(parsed.pricingModel)) ? String(parsed.pricingModel) : "FREEMIUM",
      category: String(parsed.category ?? ""),
    };
  } catch {
    return null;
  }
}

/**
 * Generate a tool draft from its website URL via OpenRouter.
 * Throws Error with a friendly message when unavailable.
 */
export async function generateToolDraft(websiteUrl: string, categoryNames: string[]): Promise<ToolDraft> {
  const { apiKey, model } = await aiConfig();
  if (!apiKey) throw new Error("AI generation is not configured (set the OpenRouter key in the admin panel).");
  if (!/^https?:\/\//i.test(websiteUrl)) throw new Error("Enter a valid website URL first.");

  const page = await scrapePage(websiteUrl);
  if (!page || (!page.title && !page.text)) throw new Error("Could not read the website. Check the URL and try again.");

  const prompt = [
    "You fill submissions for an AI tools directory.",
    "From the website content below, return ONLY a JSON object with keys:",
    `{"name": "...", "description": "1-2 clear sentences, max 200 chars", "tags": ["up to 6 lowercase tags"], "pricingModel": "FREE|FREEMIUM|PAID|CONTACT|OPEN_SOURCE", "category": "the best matching category from the list"}`,
    `Categories: ${categoryNames.join(", ")}`,
    "",
    `Website title: ${page.title}`,
    `Meta description: ${page.metaDescription}`,
    `Page text: ${page.text}`,
  ].join("\n");

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new Error("Could not reach OpenRouter. Try again later.");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("OpenRouter rejected the API key.");
    throw new Error(`OpenRouter error (${res.status}). ${body.slice(0, 120)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  const draft = extractJson(content);
  if (!draft) throw new Error("The AI response could not be parsed. Try again.");
  return draft;
}
