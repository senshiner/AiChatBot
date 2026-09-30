// Unified provider registry.
//
// - type "openai-compatible": POST {baseURL}/chat/completions via the OpenAI SDK.
//   apiKey is optional: when missing, the dummy key "unused" is sent, which works
//   for anonymous tiers (e.g. LLM7). Providers that need a real key are disabled
//   at startup with a warning when the key is absent.
// - type "rest": keyless GET {baseURL}/api/ai/chatgpt-v2 (omegatech-style).
//
// Providers are consumed in priority order first (lower `priority` number runs
// first on every request), then the remaining providers in round-robin order; a
// failing provider is skipped and put on cooldown after 3 consecutive failures.
//
// A provider may declare `baseURLFile`: path to a file whose entire content is
// the base URL, re-read on every request. Useful for URLs that change often
// (e.g. an ngrok tunnel): update the file and the new URL is picked up without
// touching code or env. `baseURLFile` wins over the static `baseURL`.

const define = (name, cfg) => [name, { timeout: 25000, enabled: true, ...cfg }];

const APIs = Object.fromEntries([
  define("groq", {
    type: "openai-compatible",
    baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || null,
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  }),
  define("zai", {
    type: "openai-compatible",
    baseURL: process.env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4",
    apiKey: process.env.ZAI_API_KEY || null,
    model: process.env.ZAI_MODEL || "glm-4.7-flash",
  }),
  define("llm7", {
    type: "openai-compatible",
    baseURL: process.env.LLM7_BASE_URL || "https://api.llm7.io/v1",
    // LLM7 has an anonymous tier: "unused" (or no key) works with lower limits.
    // Set LLM7_API_KEY (free token from https://dash.llm7.io) for higher limits.
    apiKey: process.env.LLM7_API_KEY || "unused",
    model: process.env.LLM7_MODEL || "glm-5.3",
  }),
  define("ninerouter", {
    type: "openai-compatible",
    // The user's own 9Router instance (usually published via an ngrok tunnel).
    // Priority 1: tried FIRST on every request so usage goes through 9Router
    // while it is healthy; direct providers below act as automatic fallback.
    // Disabled automatically until a URL is configured.
    baseURL: process.env.NINEROUTER_BASE_URL || "",
    baseURLFile: process.env.NINEROUTER_BASE_URL_FILE || "",
    apiKey: process.env.NINEROUTER_API_KEY || "unused",
    model: process.env.NINEROUTER_MODEL || "",
    priority: 1,
  }),
  define("omegatech", {
    type: "rest",
    baseURL: process.env.OMEGATECH_BASE_URL || "https://omegatech-api.dixonomega.tech",
    apiKey: null,
    timeout: 30000,
  }),
]);

for (const [name, p] of Object.entries(APIs)) {
  if (p.type === "openai-compatible" && !p.apiKey) {
    console.warn(`[providers] ${name}: no API key configured — disabled until one is set`);
    p.enabled = false;
  }
}

if (!APIs.ninerouter.baseURL && !APIs.ninerouter.baseURLFile) {
  console.warn("[providers] ninerouter: no URL configured — set NINEROUTER_BASE_URL or NINEROUTER_BASE_URL_FILE to enable it");
} else if (!APIs.ninerouter.model) {
  console.warn("[providers] ninerouter: NINEROUTER_MODEL is empty — the router must provide a default model");
}

export default APIs;
