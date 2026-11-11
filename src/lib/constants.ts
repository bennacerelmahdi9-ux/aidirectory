export const CATEGORIES = [
  { slug: "ai-writing", name: "AI Writing", icon: "PenLine" },
  { slug: "ai-image-generation", name: "AI Image Generation", icon: "Image" },
  { slug: "ai-video-generation", name: "AI Video Generation", icon: "Video" },
  { slug: "ai-audio-music", name: "AI Audio and Music", icon: "Music" },
  { slug: "ai-coding", name: "AI Coding", icon: "Code" },
  { slug: "ai-chatbots", name: "AI Chatbots", icon: "MessageCircle" },
  { slug: "ai-productivity", name: "AI Productivity", icon: "Zap" },
  { slug: "ai-marketing", name: "AI Marketing", icon: "Megaphone" },
  { slug: "ai-design", name: "AI Design", icon: "Palette" },
  { slug: "ai-research", name: "AI Research", icon: "Search" },
  { slug: "ai-automation", name: "AI Automation", icon: "Workflow" },
  { slug: "ai-agents", name: "AI Agents", icon: "Bot" },
  { slug: "ai-apis", name: "AI APIs", icon: "Plug" },
  { slug: "open-source-ai-models", name: "Open-Source AI Models", icon: "Brain" },
  { slug: "ai-developer-tools", name: "AI Developer Tools", icon: "Wrench" },
] as const;

export const PRICING_LABELS: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  CONTACT: "Contact sales",
  OPEN_SOURCE: "Open source",
};

export const PLATFORMS = ["Web", "iOS", "Android", "Desktop", "API", "CLI", "Browser extension"];

export const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name (A-Z)" },
];
