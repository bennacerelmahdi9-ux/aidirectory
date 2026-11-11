import { PrismaClient } from "@prisma/client";
import { CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient();

type ToolSeed = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  category: string;
  pricingModel: "FREE" | "FREEMIUM" | "PAID" | "CONTACT" | "OPEN_SOURCE";
  hasFreePlan: boolean;
  isOpenSource: boolean;
  platforms: string[];
  tags: string[];
  featured?: boolean;
};

const tools: ToolSeed[] = [
  { slug: "chatgpt", name: "ChatGPT", description: "Conversational AI assistant by OpenAI for writing, coding, analysis, and more.", websiteUrl: "https://chat.openai.com", category: "ai-chatbots", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "iOS", "Android", "API"], tags: ["llm", "chat", "openai"], featured: true },
  { slug: "claude", name: "Claude", description: "Anthropic's AI assistant focused on helpful, harmless, and honest responses.", websiteUrl: "https://claude.ai", category: "ai-chatbots", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "iOS", "Android", "API"], tags: ["llm", "chat", "anthropic"], featured: true },
  { slug: "gemini", name: "Gemini", description: "Google's multimodal AI model and chatbot.", websiteUrl: "https://gemini.google.com", category: "ai-chatbots", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "iOS", "Android", "API"], tags: ["llm", "chat", "google"] },
  { slug: "midjourney", name: "Midjourney", description: "AI image generation via Discord with high-quality artistic outputs.", websiteUrl: "https://www.midjourney.com", category: "ai-image-generation", pricingModel: "PAID", hasFreePlan: false, isOpenSource: false, platforms: ["Web", "Discord"], tags: ["image", "art"] },
  { slug: "dall-e", name: "DALL·E", description: "OpenAI's image generation model accessible via ChatGPT and API.", websiteUrl: "https://openai.com/dall-e-3", category: "ai-image-generation", pricingModel: "PAID", hasFreePlan: false, isOpenSource: false, platforms: ["Web", "API"], tags: ["image", "openai"] },
  { slug: "stable-diffusion", name: "Stable Diffusion", description: "Open-source text-to-image model by Stability AI.", websiteUrl: "https://stability.ai", category: "ai-image-generation", pricingModel: "OPEN_SOURCE", hasFreePlan: true, isOpenSource: true, platforms: ["Web", "API", "Desktop"], tags: ["image", "open-source"], featured: true },
  { slug: "leonardo-ai", name: "Leonardo.Ai", description: "AI image generation platform for creative assets and game art.", websiteUrl: "https://leonardo.ai", category: "ai-image-generation", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["image"] },
  { slug: "runway", name: "Runway", description: "AI video generation and editing tools for creators.", websiteUrl: "https://runwayml.com", category: "ai-video-generation", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["video", "genai"] },
  { slug: "pika", name: "Pika", description: "Text-to-video and idea-to-video generation.", websiteUrl: "https://pika.art", category: "ai-video-generation", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["video"] },
  { slug: "sora", name: "Sora", description: "OpenAI's text-to-video model.", websiteUrl: "https://openai.com/sora", category: "ai-video-generation", pricingModel: "PAID", hasFreePlan: false, isOpenSource: false, platforms: ["Web"], tags: ["video", "openai"] },
  { slug: "elevenlabs", name: "ElevenLabs", description: "AI voice synthesis and cloning platform.", websiteUrl: "https://elevenlabs.io", category: "ai-audio-music", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "API"], tags: ["audio", "tts", "voice"], featured: true },
  { slug: "suno", name: "Suno", description: "AI music generation from text prompts.", websiteUrl: "https://suno.com", category: "ai-audio-music", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["music", "audio"] },
  { slug: "whisper", name: "Whisper", description: "OpenAI's open-source speech recognition model.", websiteUrl: "https://github.com/openai/whisper", category: "ai-audio-music", pricingModel: "OPEN_SOURCE", hasFreePlan: true, isOpenSource: true, platforms: ["API", "CLI"], tags: ["speech", "asr", "open-source"] },
  { slug: "github-copilot", name: "GitHub Copilot", description: "AI pair programmer for code completion and chat.", websiteUrl: "https://github.com/features/copilot", category: "ai-coding", pricingModel: "PAID", hasFreePlan: true, isOpenSource: false, platforms: ["Desktop", "Web", "IDE"], tags: ["coding", "copilot"], featured: true },
  { slug: "cursor", name: "Cursor", description: "AI-first code editor built on VS Code.", websiteUrl: "https://cursor.com", category: "ai-coding", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Desktop"], tags: ["editor", "coding"] },
  { slug: "codeium", name: "Codeium", description: "Free AI code completion and chat for developers.", websiteUrl: "https://codeium.com", category: "ai-coding", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["IDE", "Web"], tags: ["coding", "completion"] },
  { slug: "tabnine", name: "Tabnine", description: "AI assistant for code completion across IDEs.", websiteUrl: "https://www.tabnine.com", category: "ai-coding", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["IDE"], tags: ["coding"] },
  { slug: "replit-ai", name: "Replit AI", description: "AI coding assistance inside Replit's online IDE.", websiteUrl: "https://replit.com", category: "ai-coding", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["coding", "ide"] },
  { slug: "notion-ai", name: "Notion AI", description: "AI writing and summarization inside Notion.", websiteUrl: "https://www.notion.so/product/ai", category: "ai-productivity", pricingModel: "PAID", hasFreePlan: false, isOpenSource: false, platforms: ["Web", "Desktop", "iOS", "Android"], tags: ["productivity", "writing"] },
  { slug: "grammarly", name: "Grammarly", description: "AI writing assistant for grammar, tone, and clarity.", websiteUrl: "https://www.grammarly.com", category: "ai-writing", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "Desktop", "Browser extension"], tags: ["writing", "grammar"] },
  { slug: "jasper", name: "Jasper", description: "AI content platform for marketing teams.", websiteUrl: "https://www.jasper.ai", category: "ai-marketing", pricingModel: "PAID", hasFreePlan: false, isOpenSource: false, platforms: ["Web"], tags: ["marketing", "content"] },
  { slug: "copy-ai", name: "Copy.ai", description: "AI copywriting and marketing content generator.", websiteUrl: "https://www.copy.ai", category: "ai-marketing", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["marketing", "copy"] },
  { slug: "canva-ai", name: "Canva Magic Studio", description: "AI design tools inside Canva.", websiteUrl: "https://www.canva.com/magic", category: "ai-design", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "iOS", "Android"], tags: ["design", "image"] },
  { slug: "figma-ai", name: "Figma AI", description: "AI features in Figma for design workflows.", websiteUrl: "https://www.figma.com/ai", category: "ai-design", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "Desktop"], tags: ["design", "ui"] },
  { slug: "perplexity", name: "Perplexity", description: "AI search engine with cited answers.", websiteUrl: "https://www.perplexity.ai", category: "ai-research", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web", "iOS", "Android", "API"], tags: ["search", "research"], featured: true },
  { slug: "consensus", name: "Consensus", description: "AI search engine for scientific research papers.", websiteUrl: "https://consensus.app", category: "ai-research", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["research", "science"] },
  { slug: "zapier-ai", name: "Zapier AI", description: "AI-powered automation and workflow builder.", websiteUrl: "https://zapier.com/ai", category: "ai-automation", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["automation", "workflow"] },
  { slug: "make", name: "Make", description: "Visual automation platform with AI integrations.", websiteUrl: "https://www.make.com", category: "ai-automation", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: false, platforms: ["Web"], tags: ["automation"] },
  { slug: "langchain", name: "LangChain", description: "Framework for building LLM-powered applications.", websiteUrl: "https://www.langchain.com", category: "ai-developer-tools", pricingModel: "OPEN_SOURCE", hasFreePlan: true, isOpenSource: true, platforms: ["API", "CLI"], tags: ["framework", "llm", "open-source"], featured: true },
  { slug: "llamaindex", name: "LlamaIndex", description: "Data framework for LLM applications and RAG.", websiteUrl: "https://www.llamaindex.ai", category: "ai-developer-tools", pricingModel: "OPEN_SOURCE", hasFreePlan: true, isOpenSource: true, platforms: ["API", "CLI"], tags: ["rag", "framework", "open-source"] },
  { slug: "huggingface", name: "Hugging Face", description: "Platform and hub for open-source ML models and datasets.", websiteUrl: "https://huggingface.co", category: "open-source-ai-models", pricingModel: "FREEMIUM", hasFreePlan: true, isOpenSource: true, platforms: ["Web", "API"], tags: ["models", "hub", "open-source"], featured: true },
  { slug: "ollama", name: "Ollama", description: "Run large language models locally.", websiteUrl: "https://ollama.com", category: "open-source-ai-models", pricingModel: "OPEN_SOURCE", hasFreePlan: true, isOpenSource: true, platforms: ["Desktop", "CLI"], tags: ["local", "llm", "open-source"] },
  { slug: "auto-gpt", name: "AutoGPT", description: "Experimental autonomous AI agent framework.", websiteUrl: "https://agpt.co", category: "ai-agents", pricingModel: "OPEN_SOURCE", hasFreePlan: true, isOpenSource: true, platforms: ["Web", "Desktop"], tags: ["agent", "open-source"] },
  { slug: "crewai", name: "CrewAI", description: "Framework for orchestrating role-playing AI agents.", websiteUrl: "https://www.crewai.com", category: "ai-agents", pricingModel: "OPEN_SOURCE", hasFreePlan: true, isOpenSource: true, platforms: ["API", "CLI"], tags: ["agent", "framework", "open-source"] },
  { slug: "openai-api", name: "OpenAI API", description: "API access to OpenAI models.", websiteUrl: "https://platform.openai.com", category: "ai-apis", pricingModel: "PAID", hasFreePlan: false, isOpenSource: false, platforms: ["API"], tags: ["api", "openai"] },
  { slug: "anthropic-api", name: "Anthropic API", description: "API access to Claude models.", websiteUrl: "https://docs.anthropic.com", category: "ai-apis", pricingModel: "PAID", hasFreePlan: false, isOpenSource: false, platforms: ["API"], tags: ["api", "anthropic"] },
];

const models = [
  { slug: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "Multimodal flagship model.", capabilities: ["text", "vision", "audio"], contextLength: 128000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://platform.openai.com/docs" },
  { slug: "gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI", description: "Small, fast, affordable model.", capabilities: ["text", "vision"], contextLength: 128000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://platform.openai.com/docs" },
  { slug: "o1", name: "o1", provider: "OpenAI", description: "Reasoning model.", capabilities: ["text", "reasoning"], contextLength: 200000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://platform.openai.com/docs" },
  { slug: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", description: "Balanced performance and speed.", capabilities: ["text", "vision", "code"], contextLength: 200000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://docs.anthropic.com" },
  { slug: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", description: "Most capable Claude 3 model.", capabilities: ["text", "vision"], contextLength: 200000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://docs.anthropic.com" },
  { slug: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "Google", description: "Long-context multimodal model.", capabilities: ["text", "vision", "audio", "video"], contextLength: 2000000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://ai.google.dev" },
  { slug: "gemini-1-5-flash", name: "Gemini 1.5 Flash", provider: "Google", description: "Fast, cost-efficient model.", capabilities: ["text", "vision"], contextLength: 1000000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://ai.google.dev" },
  { slug: "llama-3-1-405b", name: "Llama 3.1 405B", provider: "Meta", description: "Largest open Llama model.", capabilities: ["text"], contextLength: 128000, license: "Llama 3.1 Community License", isOpenSource: true, apiAvailable: true, docsUrl: "https://llama.meta.com" },
  { slug: "llama-3-1-70b", name: "Llama 3.1 70B", provider: "Meta", description: "Mid-size open model.", capabilities: ["text"], contextLength: 128000, license: "Llama 3.1 Community License", isOpenSource: true, apiAvailable: true, docsUrl: "https://llama.meta.com" },
  { slug: "qwen-2-5-72b", name: "Qwen2.5 72B", provider: "Qwen", description: "Alibaba's open model.", capabilities: ["text", "code"], contextLength: 131072, license: "Apache 2.0", isOpenSource: true, apiAvailable: true, docsUrl: "https://qwenlm.github.io" },
  { slug: "deepseek-v3", name: "DeepSeek-V3", provider: "DeepSeek", description: "Mixture-of-experts model.", capabilities: ["text", "code"], contextLength: 128000, license: "MIT", isOpenSource: true, apiAvailable: true, docsUrl: "https://www.deepseek.com" },
  { slug: "deepseek-r1", name: "DeepSeek-R1", provider: "DeepSeek", description: "Reasoning model.", capabilities: ["text", "reasoning"], contextLength: 128000, license: "MIT", isOpenSource: true, apiAvailable: true, docsUrl: "https://www.deepseek.com" },
  { slug: "mistral-large", name: "Mistral Large", provider: "Mistral", description: "Flagship Mistral model.", capabilities: ["text", "code"], contextLength: 128000, license: "Proprietary", isOpenSource: false, apiAvailable: true, docsUrl: "https://docs.mistral.ai" },
  { slug: "mixtral-8x22b", name: "Mixtral 8x22B", provider: "Mistral", description: "Open mixture-of-experts model.", capabilities: ["text", "code"], contextLength: 65536, license: "Apache 2.0", isOpenSource: true, apiAvailable: true, docsUrl: "https://docs.mistral.ai" },
];

const resources = [
  { title: "OpenAI API Reference", type: "DOCUMENTATION" as const, url: "https://platform.openai.com/docs", description: "Official OpenAI API docs.", tags: ["openai", "api"] },
  { title: "Anthropic API Docs", type: "DOCUMENTATION" as const, url: "https://docs.anthropic.com", description: "Official Anthropic docs.", tags: ["anthropic", "api"] },
  { title: "Hugging Face Datasets", type: "DATASET" as const, url: "https://huggingface.co/datasets", description: "Open datasets hub.", tags: ["datasets", "open-source"] },
  { title: "LangChain GitHub", type: "REPOSITORY" as const, url: "https://github.com/langchain-ai/langchain", description: "LangChain source code.", tags: ["langchain", "github"] },
  { title: "Ollama", type: "SDK" as const, url: "https://github.com/ollama/ollama", description: "Run LLMs locally.", tags: ["ollama", "local"] },
];

async function main() {
  // Categories
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: i },
      create: { slug: c.slug, name: c.name, order: i },
    });
  }

  const categoryMap = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id])
  );

  for (const t of tools) {
    const categoryId = categoryMap[t.category];
    if (!categoryId) continue;
    await prisma.tool.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        description: t.description,
        websiteUrl: t.websiteUrl,
        categoryId,
        pricingModel: t.pricingModel,
        hasFreePlan: t.hasFreePlan,
        isOpenSource: t.isOpenSource,
        platforms: t.platforms,
        tags: t.tags,
        featured: t.featured ?? false,
        status: "APPROVED",
        lastVerifiedAt: new Date(),
      },
      create: {
        slug: t.slug,
        name: t.name,
        description: t.description,
        websiteUrl: t.websiteUrl,
        categoryId,
        pricingModel: t.pricingModel,
        hasFreePlan: t.hasFreePlan,
        isOpenSource: t.isOpenSource,
        platforms: t.platforms,
        tags: t.tags,
        featured: t.featured ?? false,
        status: "APPROVED",
        lastVerifiedAt: new Date(),
      },
    });
  }

  for (const m of models) {
    await prisma.aIModel.upsert({
      where: { slug: m.slug },
      update: { ...m, lastVerifiedAt: new Date() },
      create: { ...m, lastVerifiedAt: new Date() },
    });
  }

  await prisma.developerResource.deleteMany();
  for (const r of resources) {
    await prisma.developerResource.create({ data: r });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
