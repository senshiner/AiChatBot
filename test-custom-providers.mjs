// Hermetic test: custom providers via env + round-robin + failover.
// Uses local stub servers, no real API keys, no network.
import http from "http";

process.env.GROQ_API_KEY = "";
process.env.GEMINI_API_KEY = "";
process.env.OPENROUTER_API_KEY = "";
process.env.ZAI_API_KEY = "";
process.env.OMEGATECH_BASE_URL = "";
process.env.CUSTOM_1_NAME = "stub-a";
process.env.CUSTOM_1_BASE_URL = "http://127.0.0.1:4011/v1";
process.env.CUSTOM_1_API_KEY = "test";
process.env.CUSTOM_1_MODEL = "model-a";
process.env.CUSTOM_2_NAME = "stub-b";
process.env.CUSTOM_2_BASE_URL = "http://127.0.0.1:4012/v1";
process.env.CUSTOM_2_API_KEY = "test";
process.env.CUSTOM_2_MODEL = "model-b";

const hits = { a: 0, b: 0 };
let failB = false;

const stub = (port, tag) =>
  http
    .createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        hits[tag]++;
        if (tag === "b" && failB) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end("{}");
          return;
        }
        const { model } = JSON.parse(body || "{}");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { content: `reply-from-${model}` } }] }));
      });
    })
    .listen(port, "127.0.0.1");

const s1 = stub(4011, "a");
const s2 = stub(4012, "b");
await new Promise((r) => setTimeout(r, 300));

const apis = (await import("./backend/configs/apis.js")).default;
delete apis.llm7; // keep the test hermetic (llm7 has a default anonymous key)
const { generateText, getProvidersStatus } = await import("./backend/utils/llmClient.js");

const names = getProvidersStatus().map((p) => p.name);
console.log("active providers:", names.join(","));
if (!names.includes("stub-a") || !names.includes("stub-b")) {
  console.error("FAIL: custom providers did not load");
  process.exit(1);
}

// 1) Round-robin: 4 sequential calls must alternate a, b, a, b.
const seq = [];
for (let i = 0; i < 4; i++) seq.push(await generateText("u1", "hi"));
console.log("round-robin replies:", seq.join(" | "));
const expectSeq = ["reply-from-model-a", "reply-from-model-b", "reply-from-model-a", "reply-from-model-b"];
if (seq.join("|") !== expectSeq.join("|")) {
  console.error("FAIL: not round-robin");
  process.exit(1);
}

// 2) Failover: stub-b starts 500ing -> after 3 failures it cools down,
//    all traffic must be served by stub-a.
failB = true;
const seq2 = [];
for (let i = 0; i < 4; i++) seq2.push(await generateText("u1", "hi"));
console.log("failover replies:", seq2.join(" | "));
if (!seq2.every((r) => r === "reply-from-model-a")) {
  console.error("FAIL: failover did not route everything to stub-a");
  process.exit(1);
}
const status = getProvidersStatus().find((p) => p.name === "stub-b");
console.log("stub-b status after failures:", JSON.stringify(status));
if (!status.inCooldown) {
  console.error("FAIL: stub-b should be in cooldown");
  process.exit(1);
}

s1.close();
s2.close();
console.log("ALL TESTS PASSED");
