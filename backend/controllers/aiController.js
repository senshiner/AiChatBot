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

export const generateAi = async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt, images, think } = req.body;

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

    const meta = await generateTextWithMeta(userId, prompt, {
      images: imageList.length > 0 ? imageList : undefined,
      think: think === true,
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
