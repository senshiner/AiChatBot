import express from "express";
import { generateAi } from "../controllers/aiController.js";
import { getProvidersStatus } from "../utils/llmClient.js";
import { auth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const aiRouter = express.Router();

aiRouter.post("/generate", auth, rateLimit, generateAi);

// Key-free provider health snapshot (for debugging which provider is down).
aiRouter.get("/providers", auth, rateLimit, (req, res) => {
  res.json({ success: true, providers: getProvidersStatus() });
});

export default aiRouter;
