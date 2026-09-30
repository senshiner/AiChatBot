import sql from "../configs/db.js";

export const getChatHistory = async (req, res) => {
  try {
    if (!sql) {
      return res.json({ success: true, messages: [], historyDisabled: true });
    }

    const userId = req.userId;

    const messages =
      await sql`select m1.id,m1.content,m1.mode,m1.created_at , (SELECT m2.content from messages m2 where m2.clerk_user_id=m1.clerk_user_id AND m2.role='assistant' AND m2.id > m1.id ORDER BY m2.id ASC limit 1  )as result  from messages m1 where m1.clerk_user_id=${userId} AND m1.role ='user' ORDER BY m1.created_at DESC  LIMIT 20`;

    res.json({ success: true, messages });
  } catch (error) {
    console.error("history error:", error.message);
    // History is a nice-to-have: degrade to empty instead of 500.
    res.json({ success: true, messages: [], historyDisabled: true });
  }
};
