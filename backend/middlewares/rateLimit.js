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

// Strict limiter untuk endpoint berkuota bayar/terbatas (mis. Sightengine:
// tiap hit ≈ 5 ops dari jatah gratis 2000/bln). 10/menit/user cukup untuk
// pemakaian wajar tapi bikin abuse mahal.
const strictHits = new Map();
const STRICT_MAX_HITS = 10;
setInterval(() => strictHits.clear(), WINDOW_MS).unref();

export const strictRateLimit = (req, res, next) => {
  const key = req.userId || req.ip;
  const count = (strictHits.get(key) || 0) + 1;
  strictHits.set(key, count);
  if (count > STRICT_MAX_HITS) {
    return res.status(429).json({ success: false, message: "detection rate limited, try again later" });
  }
  next();
};
