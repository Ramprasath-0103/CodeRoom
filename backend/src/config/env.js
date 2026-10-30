import "dotenv/config";

function parseOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export const env = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  allowedOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  rapidApiKey: process.env.RAPIDAPI_KEY ?? "",
});
