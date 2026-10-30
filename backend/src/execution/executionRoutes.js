import { Router } from "express";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { executeCode, parseExecutionRequest } from "./executionService.js";
import { SUPPORTED_LANGUAGES } from "./judge0Languages.js";

export function createExecutionRouter() {
  const router = Router();

  const executionLimiter = createRateLimiter({
    limit: 10,
    message: "Too many runs, please wait a minute",
  });

  router.get("/languages", (req, res) => {
    res.json({ languages: SUPPORTED_LANGUAGES });
  });

  router.post("/", executionLimiter, async (req, res) => {
    const result = await executeCode(parseExecutionRequest(req.body));
    res.json(result);
  });

  return router;
}
