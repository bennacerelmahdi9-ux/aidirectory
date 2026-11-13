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

/* ------------------------------------------------------------------ */
/* Natural-language search (#3)                                        */
/* ------------------------------------------------------------------ */

export type ParsedQuery = {
  /** Optional narrowed-down free-text query. */
  cleanedQuery?: string;
  category?: string;
  pricing?: string;
  free?: boolean;
  openSource?: boolean;
  tags?: string[];
};

const VALID_PRICING = new Set(["FREE", "FREEMIUM", "PAID", "CONTACT", "OPEN_SOURCE"]);

/**
 * Convert a natural-language search query into directory filters via
 * OpenRouter. Throws Error with a friendly message when unavailable.
 */
export async function parseNaturalLanguageQuery(query: string, categoryNames: string[]): Promise<ParsedQuery> {
  const { apiKey, model } = await aiConfig();
  if (!apiKey) throw new Error("AI search is not configured (set the OpenRouter key in the admin panel).");

  const prompt = [
    "You convert a user's search query into filters for an AI tools directory.",
    "Return ONLY a JSON object with this exact shape (omit keys that don't apply):",
    `{"cleanedQuery": "short free-text keywords to match against tool names/descriptions, or omit", "category": "best matching category name from the list, or omit", "pricing": "FREE|FREEMIUM|PAID|CONTACT|OPEN_SOURCE, or omit", "free": true when the user asks for free tools, "openSource": true when the user asks for open-source tools, "tags": ["up to 4 lowercase keywords"]}`,
    "Do not invent filters the query does not imply. Never set pricing to PAID unless asked.",
    `Categories: ${categoryNames.join(", ")}`,
    "",
    `User query: ${query}`,
  ].join("\n");

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new Error("Could not reach OpenRouter. Try again later.");
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("OpenRouter rejected the API key.");
    throw new Error(`OpenRouter error (${res.status}).`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("The AI response could not be parsed. Try again.");

  try {
    const parsed = JSON.parse(json) as Partial<ParsedQuery>;
    const out: ParsedQuery = {};
    if (typeof parsed.cleanedQuery === "string" && parsed.cleanedQuery.trim()) {
      out.cleanedQuery = parsed.cleanedQuery.trim().slice(0, 100);
    }
    if (typeof parsed.category === "string" && categoryNames.includes(parsed.category)) {
      out.category = parsed.category;
    }
    if (typeof parsed.pricing === "string" && VALID_PRICING.has(parsed.pricing)) {
      out.pricing = parsed.pricing;
    }
    if (parsed.free === true) out.free = true;
    if (parsed.openSource === true) out.openSource = true;
    if (Array.isArray(parsed.tags)) {
      out.tags = parsed.tags
        .map((t) => String(t).toLowerCase().slice(0, 30))
        .filter(Boolean)
        .slice(0, 4);
    }
    return out;
  } catch {
    throw new Error("The AI response could not be parsed. Try again.");
  }
}

/* ------------------------------------------------------------------ */
/* AI tool comparison (#1)                                             */
/* ------------------------------------------------------------------ */

export type CompareToolInput = {
  name: string;
  description: string;
  websiteUrl: string;
  pricingModel: string;
  hasFreePlan: boolean;
  isOpenSource: boolean;
  tags: string[];
};

/**
 * Generate a narrative comparison between tools (2-3) by scraping their
 * websites and asking OpenRouter. Returns plain text with simple
 * paragraphs; the caller renders it and labels it AI-generated.
 */
export async function compareToolsWithAI(tools: CompareToolInput[]): Promise<string> {
  const { apiKey, model } = await aiConfig();
  if (!apiKey) throw new Error("AI comparison is not configured (set the OpenRouter key in the admin panel).");
  if (tools.length < 2) throw new Error("Pick at least two tools to compare.");

  const parts: string[] = [];
  for (const t of tools.slice(0, 3)) {
    const page = await scrapePage(t.websiteUrl);
    parts.push(
      [
        `## ${t.name}`,
        `Pricing: ${t.pricingModel}${t.hasFreePlan ? " (has a free plan)" : ""}${t.isOpenSource ? ", open source" : ""}`,
        `Directory description: ${t.description}`,
        `Tags: ${t.tags.join(", ") || "none"}`,
        page ? `Website title: ${page.title}\nMeta description: ${page.metaDescription}\nPage text: ${page.text.slice(0, 2500)}` : "Website could not be read.",
      ].join("\n"),
    );
  }

  const prompt = [
    "You compare AI tools for a directory. Use ONLY the data below — do not invent facts, pricing, or statistics.",
    "Write a concise comparison (max 350 words) in plain text with this structure:",
    "1. One-sentence overview of what each tool is.",
    "2. Key differences (pricing, openness, focus).",
    "3. \"Best for:\" recommendation — which kind of user should pick which tool.",
    "Do not use markdown headings or bullet-point symbols other than dashes.",
    "",
    parts.join("\n\n"),
  ].join("\n");

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new Error("Could not reach OpenRouter. Try again later.");
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error("OpenRouter rejected the API key.");
    throw new Error(`OpenRouter error (${res.status}).`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) throw new Error("The AI response could not be parsed. Try again.");
  return content.slice(0, 4000);
}
