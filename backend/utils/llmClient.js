import axios from "axios";
import OpenAI from "openai";
import APIs from "../configs/apis.js";

const sessions = new Map();

const getSession = (userId, providerName) =>
  sessions.get(`${userId}:${providerName}`) || { chatId: "", sessionId: "" };

const saveSession = (userId, providerName, session) => {
  sessions.set(`${userId}:${providerName}`, session);
};

const callOpenAiCompatible = async (provider, prompt) => {
  if (!provider.apiKey) throw new Error("provider API key is not configured");

  const client = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL });
  const response = await client.chat.completions.create({
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
    timeout: 30000,
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

export const generateText = async (userId, prompt) => {
  const providers = Object.entries(APIs);
  const errors = [];

  for (const [providerName, provider] of providers) {
    try {
      return await callProvider(provider, providerName, userId, prompt);
    } catch (error) {
      errors.push(`${providerName}: ${error.message}`);
      console.error(`Provider ${providerName} failed:`, error.message);
    }
  }

  const error = new Error("all AI providers failed");
  error.providerErrors = errors;
  throw error;
};

export const resetProviderSessions = (userId) => {
  for (const providerName of Object.keys(APIs)) {
    sessions.delete(`${userId}:${providerName}`);
  }
};

export { listApis } from "../configs/apis.js";
