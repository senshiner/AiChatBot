// Live provider test — run from the backend/ folder:
//   1. copy .env.example to .env and fill GROQ_API_KEY (never share this file)
//   2. npm install (once)
//   3. node test-live.mjs
//
// What it does:
//   - checks the Groq key is valid and lists available models
//   - verifies the configured GROQ_MODEL exists on Groq
//   - sends one real chat through the backend's provider stack
//     (priority -> round-robin -> failover), exactly like the app does
// This script never prints your API key.
import "dotenv/config";
import OpenAI from "openai";
import { generateText, getProvidersStatus } from "./utils/llmClient.js";

const baseURL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const key = process.env.GROQ_API_KEY;

if (!key) {
  console.error("GROQ_API_KEY kosong. Isi dulu di backend/.env (lihat .env.example).");
  process.exit(1);
}

// 1) Key valid? Which models are available?
const client = new OpenAI({ apiKey: key, baseURL, timeout: 25000 });
let modelIds = [];
try {
  const list = await client.models.list();
  modelIds = list.data.map((m) => m.id).sort();
  console.log(`[1/3] Groq key VALID — ${modelIds.length} model tersedia.`);
} catch (e) {
  console.error("[1/3] Groq key DITOLAK / request gagal:", e.message);
  process.exit(1);
}

const want = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
if (modelIds.includes(want)) {
  console.log(`[2/3] Model "${want}" TERSEDIA di Groq.`);
} else {
  console.log(`[2/3] Model "${want}" TIDAK ADA di Groq.`);
  console.log("      Tersedia:", modelIds.slice(0, 12).join(", "));
  console.log("      -> set GROQ_MODEL di .env ke salah satu di atas, lalu ulangi tes.");
  process.exit(1);
}

// 2) End-to-end through the backend provider stack
console.log("[3/3] Provider aktif menurut backend:");
console.table(
  getProvidersStatus().map((p) => ({
    name: p.name,
    model: p.model,
    priority: p.priority ?? "-",
    key: p.keyConfigured ? "ya" : "tidak",
  }))
);

try {
  const reply = await generateText(
    "live-test",
    "Jawab dalam satu kalimat singkat: apa ibu kota Indonesia?"
  );
  console.log("\nBalasan AI:\n" + reply);
  console.log("\nTES LOLOS — provider Groq bekerja lewat backend.");
} catch (e) {
  console.error("\nTES GAGAL:", e.message);
  if (e.providerErrors) console.error("Rincian:", e.providerErrors.join(" | "));
  process.exit(1);
}
