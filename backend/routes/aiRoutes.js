import express from "express";
import { generateAi } from "../controllers/aiController.js";
import { getProvidersStatus, peekProvider } from "../utils/llmClient.js";
import { auth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const aiRouter = express.Router();

aiRouter.post("/generate", auth, rateLimit, generateAi);

// Which provider/model would serve the next request (no side effects).
// The frontend uses this for the typing indicator ("model yang sedang typing").
aiRouter.get("/provider-preview", auth, rateLimit, (req, res) => {
  const kind = ["vision", "think"].includes(req.query.kind) ? req.query.kind : "text";
  const peek = peekProvider(kind);
  if (!peek) return res.json({ success: false, message: "no AI providers configured" });
  res.json({ success: true, provider: peek.provider, model: peek.model });
});

// Key-free provider health snapshot (for debugging which provider is down).
aiRouter.get("/providers", auth, rateLimit, (req, res) => {
  res.json({ success: true, providers: getProvidersStatus() });
});

export default aiRouter;
