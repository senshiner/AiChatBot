// Unified provider registry.
//
// - type "openai-compatible": POST {baseURL}/chat/completions via the OpenAI SDK.
//   apiKey is optional: when missing, the dummy key "unused" is sent, which works
//   for anonymous tiers (e.g. LLM7). Providers that need a real key are disabled
//   at startup with a warning when the key is absent.
// - type "rest": keyless GET {baseURL}/api/ai/chatgpt-v2 (omegatech-style).
//
// Providers are consumed in round-robin order; a failing provider is skipped and
// put on cooldown after 3 consecutive failures.

const define = (name, cfg) => [name, { timeout: 25000, enabled: true, ...cfg }];

const APIs = Object.fromEntries([
  define("groq", {
    type: "openai-compatible",
    baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || null,
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
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
    model: process.env.LLM7_MODEL || "GLM-5.3-Flash",
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

export default APIs;
