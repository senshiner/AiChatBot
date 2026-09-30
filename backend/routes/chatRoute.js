import express from "express";
import { getChatHistory } from "../controllers/chatController.js";
import { auth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const chatRouter = express.Router();
chatRouter.get("/history", auth, rateLimit, getChatHistory);

export default chatRouter;
