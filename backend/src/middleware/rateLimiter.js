import { rateLimit } from "express-rate-limit";

const ONE_MINUTE_MS = 60_000;

export function createRateLimiter({ limit, message }) {
  return rateLimit({
    windowMs: ONE_MINUTE_MS,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
  });
}
