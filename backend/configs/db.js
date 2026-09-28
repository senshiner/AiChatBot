import "dotenv/config";
import { neon } from "@neondatabase/serverless";

// The database is optional: chat history is disabled gracefully when
// DATABASE_URL is not set, instead of crashing the server at import time.
let sql = null;
if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
} else {
  console.warn("[db] DATABASE_URL is not set — chat history is disabled");
}

export default sql;
