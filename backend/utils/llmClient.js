import axios from "axios";
import fs from "fs";
import OpenAI from "openai";
import APIs from "../configs/apis.js";

// Per-user sessions for "rest" providers (omegatech-style chat continuity).
const sessions = new Map();
const MAX_SESSIONS = 2000;

// Provider health for failover: name -> { fails, cooldownUntil }.
const health = new Map();
const MAX_FAILS = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

// Round-robin cursor for non-priority providers: each request starts at the
// next one so quota usage spreads across free tiers instead of burning one
// provider's daily limit. Providers with a numeric `priority` are always tried
// first (lowest number first) on every request and never rotate.
let cursor = 0;

// Resolve a provider's base URL for this request. `baseURLFile` (a file whose
// whole content is the URL) is re-read every time so frequently-changing URLs
// — e.g. an ngrok tunnel address — are picked up without a restart.
const resolveBaseURL = (p) => {
  if (p.baseURLFile) {
    try {
      const fromFile = fs.readFileSync(p.baseURLFile, "utf8").trim();
      if (fromFile) return fromFile;
    } catch {
      // Fall through to the static baseURL below.
    }
  }
  return p.baseURL || "";
};

const activeProviders = () =>
  Object.entries(APIs)
    .filter(([, p]) => p.enabled !== false)
    .map(([name, p]) => ({ name, ...p, baseURL: resolveBaseURL(p) }))
    // A provider without a resolvable URL (e.g. 9Router not configured yet)
    // is skipped for this request instead of failing.
    .filter((p) => p.baseURL);

const getSession = (userId, providerName) =>
  sessions.get(`${userId}:${providerName}`) || { chatId: "", sessionId: "" };

const saveSession = (userId, providerName, session) => {
  if (sessions.size >= MAX_SESSIONS) {
    // Map preserves insertion order: drop the oldest entry.
    sessions.delete(sessions.keys().next().value);
  }
  sessions.set(`${userId}:${providerName}`, session);
};

const callOpenAiCompatible = async (provider, prompt) => {
  const client = new OpenAI({
    apiKey: provider.apiKey || "unused",
    baseURL: provider.baseURL,
    timeout: provider.timeout || 25000,
  });
  const response = await client.chat.completions.create({
    model: provider.model,
    messages: [{ role: "user", content: prompt }],
  });

  const result = response?.choices?.[0]?.message?.content;
  if (!result) throw new Error("provider returned an empty response");
  return result;
};

const callRestProvider = async (provider, providerName, userId, prompt) => {
  const session = getSession(userId, providerName);
  const { data } = await axios.get(`${provider.baseURL}/api/ai/chatgpt-v2`, {
    params: {
      action: "chat",
      message: prompt,
      chatId: session.chatId,
      sessionId: session.sessionId,
    },
    timeout: provider.timeout || 30000,
  });

  const result = data?.data?.reply;
  if (!result) throw new Error("provider returned an empty response");

  if (data.data.chatId || data.data.sessionId) {
    saveSession(userId, providerName, {
      chatId: data.data.chatId || session.chatId,
      sessionId: data.data.sessionId || session.sessionId,
    });
  }

  return result;
};

const callProvider = (provider, providerName, userId, prompt) => {
  if (provider.type === "openai-compatible") {
    return callOpenAiCompatible(provider, prompt);
  }
  if (provider.type === "rest") {
    return callRestProvider(provider, providerName, userId, prompt);
  }
  throw new Error(`unsupported provider type: ${provider.type}`);
};

const markSuccess = (name) => health.set(name, { fails: 0, cooldownUntil: 0 });

const markFailure = (name) => {
  const h = health.get(name) || { fails: 0, cooldownUntil: 0 };
  h.fails += 1;
  if (h.fails >= MAX_FAILS) h.cooldownUntil = Date.now() + COOLDOWN_MS;
  health.set(name, h);
};

// Candidate order for the next request: priority providers first (fixed
// order), then the rest in round-robin rotation, skipping providers that are
// in cooldown after repeated failures. Pure read — no cursor/health changes.
const planOrder = () => {
  const providers = activeProviders();
  const now = Date.now();

  const priority = providers
    .filter((p) => typeof p.priority === "number")
    .sort((a, b) => a.priority - b.priority);
  const rest = providers.filter((p) => typeof p.priority !== "number");
  const rotatedRest = rest.map((_, i) => rest[(cursor + i) % rest.length]);
  const order = [...priority, ...rotatedRest].filter((p) => {
    const h = health.get(p.name);
    return !(h && h.cooldownUntil > now);
  });
  return { order, rest };
};

export const generateTextWithMeta = async (userId, prompt) => {
  const { order, rest } = planOrder();

  if (order.length === 0) {
    const error = new Error("all AI providers are in cooldown");
    error.providerErrors = activeProviders().map((p) => {
      const h = health.get(p.name);
      return h && h.cooldownUntil > Date.now()
        ? `${p.name}: cooling down after repeated failures`
        : `${p.name}: unavailable`;
    });
    throw error;
  }

  const errors = [];

  for (const p of order) {
    try {
      const text = await callProvider(p, p.name, userId, prompt);
      markSuccess(p.name);
      // Advance the round-robin cursor only when a rotating provider served
      // the request; priority providers never disturb the rotation.
      const restIdx = rest.indexOf(p);
      if (restIdx !== -1) cursor = (restIdx + 1) % rest.length;
      return { text, provider: p.name, model: p.model || null };
    } catch (error) {
      markFailure(p.name);
      errors.push(`${p.name}: ${error.message}`);
      console.error(`Provider ${p.name} failed:`, error.message);
    }
  }

  const error = new Error("all AI providers failed");
  error.providerErrors = errors;
  throw error;
};

export const generateText = async (userId, prompt) =>
  (await generateTextWithMeta(userId, prompt)).text;

// Which provider/model would serve the next request, without side effects
// (no cursor advance, no health changes). Used for the typing indicator.
export const peekProvider = () => {
  const { order } = planOrder();
  const p = order[0];
  return p ? { provider: p.name, model: p.model || null } : null;
};

// Key-free status snapshot for the /api/ai/providers debug endpoint.
export const getProvidersStatus = () => {
  const now = Date.now();
  return activeProviders().map((p) => {
    const h = health.get(p.name) || { fails: 0, cooldownUntil: 0 };
    return {
      name: p.name,
      type: p.type,
      model: p.model || null,
      priority: typeof p.priority === "number" ? p.priority : null,
      keyConfigured: !!p.apiKey && p.apiKey !== "unused",
      consecutiveFailures: h.fails,
      inCooldown: h.cooldownUntil > now,
    };
  });
};
