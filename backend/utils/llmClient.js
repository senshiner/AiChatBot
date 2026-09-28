import axios from "axios";
import OpenAI from "openai";
import APIs from "../configs/apis.js";

// Per-user sessions for "rest" providers (omegatech-style chat continuity).
const sessions = new Map();
const MAX_SESSIONS = 2000;

// Provider health for failover: name -> { fails, cooldownUntil }.
const health = new Map();
const MAX_FAILS = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

// Round-robin cursor: each request starts at the next provider so quota usage
// spreads across free tiers instead of burning one provider's daily limit.
let cursor = 0;

const activeProviders = () =>
  Object.entries(APIs)
    .filter(([, p]) => p.enabled !== false)
    .map(([name, p]) => ({ name, ...p }));

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

export const generateText = async (userId, prompt) => {
  const providers = activeProviders();
  if (providers.length === 0) throw new Error("no AI providers configured");

  const now = Date.now();
  const order = [];
  const errors = [];

  for (let i = 0; i < providers.length; i++) {
    const p = providers[(cursor + i) % providers.length];
    const h = health.get(p.name);
    if (h && h.cooldownUntil > now) {
      errors.push(`${p.name}: cooling down after repeated failures`);
      continue;
    }
    order.push(p);
  }

  if (order.length === 0) {
    const error = new Error("all AI providers are in cooldown");
    error.providerErrors = errors;
    throw error;
  }

  for (const p of order) {
    try {
      const result = await callProvider(p, p.name, userId, prompt);
      markSuccess(p.name);
      cursor = (providers.indexOf(p) + 1) % providers.length;
      return result;
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

// Key-free status snapshot for the /api/ai/providers debug endpoint.
export const getProvidersStatus = () => {
  const now = Date.now();
  return activeProviders().map((p) => {
    const h = health.get(p.name) || { fails: 0, cooldownUntil: 0 };
    return {
      name: p.name,
      type: p.type,
      model: p.model || null,
      keyConfigured: !!p.apiKey && p.apiKey !== "unused",
      consecutiveFailures: h.fails,
      inCooldown: h.cooldownUntil > now,
    };
  });
};
