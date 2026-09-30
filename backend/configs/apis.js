// Unified provider registry.
//
// - type "openai-compatible": POST {baseURL}/chat/completions via the OpenAI SDK.
//   apiKey is optional: when missing, the dummy key "unused" is sent, which works
//   for anonymous tiers (e.g. LLM7). Providers that need a real key are disabled
//   at startup with a warning when the key is absent.
// - type "rest": keyless GET {baseURL}/api/ai/chatgpt-v2 (omegatech-style).
//
// First-class providers below are configured with <NAME>_BASE_URL /
// <NAME>_API_KEY / <NAME>_MODEL env vars. For any OTHER OpenAI-compatible API,
// use the generic CUSTOM_1..CUSTOM_9 slots — no code changes needed:
//
//   CUSTOM_1_NAME="my-ai"
//   CUSTOM_1_BASE_URL="https://my-ai.example.com/v1"
//   CUSTOM_1_API_KEY="<redacted>"
//   CUSTOM_1_MODEL="my-model"
//   CUSTOM_1_PRIORITY="2"        # optional: numeric = tried first every request
//   CUSTOM_1_TYPE="openai-compatible"  # optional, this is the default
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

const fixedProviders = [
  define("groq", {
    type: "openai-compatible",
    baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || null,
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  }),
  define("gemini", {
    type: "openai-compatible",
    baseURL:
      process.env.GEMINI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.GEMINI_API_KEY || null,
    // Verified working 2026-09-30. NOTE: gemini-2.5-flash is retired for new
    // users (API returns 404 telling you to upgrade).
    model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    vision: true, // model ini juga bisa baca gambar (dipakai saat ada lampiran)
  }),
  // "Berpikir keras": model reasoning khusus, hanya dipakai saat think=true.
  define("groq-think", {
    type: "openai-compatible",
    baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || null,
    model: process.env.GROQ_THINK_MODEL || "openai/gpt-oss-120b",
    role: "think",
    think: true,
    timeout: 60000,
  }),
  define("openrouter", {
    type: "openai-compatible",
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || null,
    // Free models use the ":free" suffix, e.g. "deepseek/deepseek-r1:free".
    model: process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free",
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
];

// Generic slots for any other OpenAI-compatible API: name + base URL (+ key +
// model) purely from env, no code changes. Empty NAME or BASE_URL = slot unused.
const customProviders = [];
for (let i = 1; i <= 9; i++) {
  const rawName = (process.env[`CUSTOM_${i}_NAME`] || "").trim();
  const baseURL = (process.env[`CUSTOM_${i}_BASE_URL`] || "").trim();
  if (!rawName || !baseURL) continue;
  const name = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const prioRaw = (process.env[`CUSTOM_${i}_PRIORITY`] || "").trim();
  const baseURLFile = (process.env[`CUSTOM_${i}_BASE_URL_FILE`] || "").trim();
  customProviders.push(
    define(name, {
      type: (process.env[`CUSTOM_${i}_TYPE`] || "openai-compatible").trim(),
      baseURL,
      ...(baseURLFile ? { baseURLFile } : {}),
      apiKey: process.env[`CUSTOM_${i}_API_KEY`] || null,
      model: (process.env[`CUSTOM_${i}_MODEL`] || "").trim(),
      ...(prioRaw !== "" && !Number.isNaN(Number(prioRaw))
        ? { priority: Number(prioRaw) }
        : {}),
    })
  );
}

const APIs = Object.fromEntries([...fixedProviders, ...customProviders]);

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
