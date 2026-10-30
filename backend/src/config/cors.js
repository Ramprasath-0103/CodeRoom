import { env } from "./env.js";

export function isOriginAllowed(origin) {
  if (env.allowedOrigins.length === 0) {
    return true;
  }

  return Boolean(origin) && env.allowedOrigins.includes(origin);
}

export const corsOptions = {
  origin: env.allowedOrigins.length === 0 ? "*" : env.allowedOrigins,
};
