// Tiny fixed-window rate limiter (per user, falls back to IP).
// Generous on purpose: this app has no usage tiers, this only stops
// accidental loops from burning the free providers' quotas.
const hits = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_HITS = 60;

// Clear the window on a timer instead of per request (cheaper).
setInterval(() => hits.clear(), WINDOW_MS).unref();

export const rateLimit = (req, res, next) => {
  const key = req.userId || req.ip;
  const count = (hits.get(key) || 0) + 1;
  hits.set(key, count);
  if (count > MAX_HITS) {
    return res.status(429).json({ success: false, message: "too many requests, slow down" });
  }
  next();
};
