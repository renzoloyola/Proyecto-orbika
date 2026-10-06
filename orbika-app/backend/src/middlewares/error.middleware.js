import { AppError } from "../errors/AppError.js";

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  console.error("[api]", err);
  return res.status(500).json({
    error: "Error interno del servidor.",
    code: "INTERNAL_ERROR",
  });
}

