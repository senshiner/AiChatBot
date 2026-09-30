import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";
import chatRouter from "./routes/chatRoute.js";

const app = express();

app.use(helmet());
// Restrict CORS to the configured frontend origin(s) instead of "*".
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
// 25mb: menampung 4 gambar base64 (batas 6MB per gambar di controller).
// Catatan: body besar tetap di-parse sebelum auth — bounded & wajar untuk demo.
app.use(express.json({ limit: "25mb" })); // lampiran gambar base64
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("backend is running");
});

app.use("/api/ai", aiRouter);
app.use("/api/chat", chatRouter);

app.use((err, req, res, next) => {
  if (err.message === "Unauthenticated") {
    return res.status(401).json({ message: "Authentication required" });
  }
  // Body-parser errors (express.json): jangan jadi 500.
  if (err.type === "entity.parse.failed" || err.status === 400) {
    return res.status(400).json({ success: false, message: "invalid JSON body" });
  }
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({ success: false, message: "payload too large" });
  }
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
