import { HttpError } from "../errors/HttpError.js";

function resolveStatus(error) {
  return Number.isInteger(error.status) && error.status >= 400 ? error.status : 500;
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = resolveStatus(error);
  const isHttpError = error instanceof HttpError;
  const isClientSafe = isHttpError || (status < 500 && error.expose);

  if (status >= 500) {
    const details = isHttpError ? error.message : error;
    console.error(`${req.method} ${req.originalUrl} failed with ${status}:`, details);
  }

  res.status(status).json({
    message: isClientSafe ? error.message : "Internal server error",
  });
}
