import { generateTextWithMeta } from "../utils/llmClient.js";
import sql from "../configs/db.js";

const MAX_PROMPT_LENGTH = 8000;
const MAX_IMAGES = 4;
// Data URL gambar hasil resize client (batas kecil); tolak yang kelewat besar.
const MAX_IMAGE_DATAURL_LENGTH = 6_000_000;

// Best-effort history persistence. Never fails the request: if the DB is not
// configured or the insert fails, generation still succeeds.
const saveMessage = async (userId, prompt, result) => {
  if (!sql) return;
  try {
    await sql`insert into messages(clerk_user_id, role, mode, content)
      values (${userId}, 'user', 'text', ${prompt}),
             (${userId}, 'assistant', 'text', ${result})`;
  } catch (e) {
    console.error("Failed to save chat message:", e.message);
  }
};

const isImageDataUrl = (s) =>
  typeof s === "string" &&
  /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s) &&
  s.length <= MAX_IMAGE_DATAURL_LENGTH;

// ---------------------------------------------------------------------------
// Deteksi AI-generated image via Sightengine (free tier, tanpa makan token LLM).
// POST /api/ai/detect  body: { image: "data:image/...;base64,..." }
// ---------------------------------------------------------------------------
export const detectAiImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!isImageDataUrl(image)) {
      return res.status(400).json({ success: false, message: "invalid image data" });
    }

    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;
    if (!apiUser || !apiSecret) {
      return res.status(500).json({ success: false, message: "detector not configured" });
    }

    const mime = image.match(/^data:(image\/[a-z+]+);base64,/)[1];
    const buffer = Buffer.from(image.split(",")[1], "base64");

    const form = new FormData();
    form.append("api_user", apiUser);
    form.append("api_secret", apiSecret);
    form.append("models", process.env.SIGHTENGINE_MODELS || "genai");
    form.append("media", new Blob([buffer], { type: mime }), "image.jpg");

    const resp = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form,
    });
    const data = await resp.json().catch(() => null);
    if (!data || data.status !== "success") {
      console.error("Sightengine error:", data?.error || resp.status);
      return res
        .status(502)
        .json({ success: false, message: data?.error?.message || "detector failed" });
    }

    const raw = data?.type?.ai_generated ?? data?.ai_generated ?? null;
    if (typeof raw !== "number") {
      console.error("Sightengine unexpected response:", JSON.stringify(data).slice(0, 200));
      return res.status(502).json({ success: false, message: "unexpected detector response" });
    }

    return res.json({ success: true, score: Math.round(raw * 100) });
  } catch (error) {
    console.error("Detect AI error:", error.message);
    return res.status(500).json({ success: false, message: "detection failed" });
  }
};

export const generateAi = async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt, images, think, history } = req.body;

    // validation
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, message: "prompt is required" });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ success: false, message: "prompt too long (max 8000 characters)" });
    }

    const imageList = Array.isArray(images) ? images : [];
    if (imageList.length > MAX_IMAGES) {
      return res.status(400).json({ success: false, message: `max ${MAX_IMAGES} images` });
    }
    if (imageList.some((s) => !isImageDataUrl(s))) {
      return res.status(400).json({ success: false, message: "invalid image data" });
    }

    // Riwayat chat dari frontend (opsional). Disanitasi di sini agar provider
    // hanya menerima {role, content} teks yang valid — cegah token bloat.
    const cleanHistory = Array.isArray(history)
      ? history
          .filter(
            (h) =>
              h &&
              (h.role === "user" || h.role === "assistant") &&
              typeof h.content === "string" &&
              h.content.trim()
          )
          .slice(-20)
          .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }))
      : [];

    const meta = await generateTextWithMeta(userId, prompt, {
      images: imageList.length > 0 ? imageList : undefined,
      think: think === true,
      history: cleanHistory,
    });

    saveMessage(userId, prompt, meta.text);

    return res.json({ success: true, result: meta.text, provider: meta.provider, model: meta.model });
  } catch (error) {
    console.error("AI Error:", error.providerErrors || error.message);
    const status = error.status || error.response?.status || 500;
    // Don't leak provider internals to the client; details are in the server log.
    const message = status === 429 ? "server busy" : "generator failed";

    res.status(status).json({ success: false, message });
  }
};
