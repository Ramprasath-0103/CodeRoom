import { env } from "../config/env.js";
import { HttpError } from "../errors/HttpError.js";
import { getJudge0LanguageId } from "./judge0Languages.js";

const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_SUBMISSION_URL = `https://${JUDGE0_HOST}/submissions?base64_encoded=false&wait=true`;
const MAX_SOURCE_LENGTH = 50_000;
const REQUEST_TIMEOUT_MS = 20_000;

export function parseExecutionRequest(body) {
  const { language, sourceCode } = body ?? {};
  const languageId = getJudge0LanguageId(language);

  if (languageId === null) {
    throw new HttpError(400, `Running ${language || "this"} code is not supported`);
  }

  if (typeof sourceCode !== "string" || sourceCode.trim() === "") {
    throw new HttpError(400, "Source code is required");
  }

  if (sourceCode.length > MAX_SOURCE_LENGTH) {
    throw new HttpError(413, `Source code must be under ${MAX_SOURCE_LENGTH} characters`);
  }

  return { languageId, sourceCode };
}

async function submitToJudge0({ languageId, sourceCode }) {
  try {
    return await fetch(JUDGE0_SUBMISSION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": env.rapidApiKey,
        "X-RapidAPI-Host": JUDGE0_HOST,
      },
      body: JSON.stringify({ source_code: sourceCode, language_id: languageId }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new HttpError(504, "Code execution timed out", { cause: error });
    }

    throw new HttpError(502, "Code execution service is unreachable", { cause: error });
  }
}

function toExecutionResult(submission) {
  return {
    status: submission.status?.description ?? "Unknown",
    stdout: submission.stdout ?? "",
    stderr: submission.stderr ?? "",
    compileOutput: submission.compile_output ?? "",
    message: submission.message ?? "",
    time: submission.time ?? null,
    memory: submission.memory ?? null,
  };
}

export async function executeCode(request) {
  if (!env.rapidApiKey) {
    throw new HttpError(503, "Code execution is not configured on this server");
  }

  const response = await submitToJudge0(request);

  if (response.status === 429) {
    throw new HttpError(429, "Code execution quota reached, please try again later");
  }

  if (!response.ok) {
    throw new HttpError(502, `Code execution service responded with ${response.status}`);
  }

  return toExecutionResult(await response.json());
}
