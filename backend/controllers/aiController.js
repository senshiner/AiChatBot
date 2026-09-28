import FormData from "form-data";
import { generateText } from "../utils/llmClient.js";
import axios from "axios";
import sql from "../configs/db.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_PROMPT_LENGTH = 8000;

// Best-effort history persistence. Never fails the request: if the DB is not
// configured or the insert fails, generation still succeeds.
const saveMessage = async (userId, mode, prompt, result) => {
  if (!sql) return;
  try {
    await sql`insert into messages(clerk_user_id, role, mode, content)
      values (${userId}, 'user', ${mode}, ${prompt}),
             (${userId}, 'assistant', ${mode}, ${result})`;
  } catch (e) {
    console.error("Failed to save chat message:", e.message);
  }
};

export const generateAi = async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt, mode } = req.body;

    // validation
    if (!prompt || !mode) {
      return res.status(400).json({ success: false, message: "prompt and mode are required" });
    }

    if (!["text", "image"].includes(mode)) {
      return res.status(400).json({ success: false, message: "invalid mode" });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ success: false, message: "prompt too long (max 8000 characters)" });
    }

    let result;
    if (mode === "text") {
      result = await generateText(userId, prompt);
    } else {
      const formData = new FormData();
      formData.append("prompt", prompt);
      const { data } = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
        headers: { "X-API-KEY": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
        timeout: 60000,
      });
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "ai_chat_images",
              public_id: `user_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            },
            (error, result) => (error ? reject(error) : resolve(result))
          )
          .end(data);
      });

      // uploading buffer into cloudinary
      result = uploadResponse.secure_url;
    }

    saveMessage(userId, mode, prompt, result);

    return res.json({ success: true, result });
  } catch (error) {
    console.error("AI Error:", error.providerErrors || error.message);
    const status = error.status || error.response?.status || 500;
    // Don't leak provider internals to the client; details are in the server log.
    const message = status === 429 ? "server busy" : "generator failed";

    res.status(status).json({ success: false, message });
  }
};
