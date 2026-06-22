import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
  headers: { "Content-Type": "application/json" },
});

export async function executeCode(language: string, sourceCode: string) {
  try {
    const version = LANGUAGE_VERSIONS[language];
    const response = await API.post("/execute", {
      language: language,
      version: version,
      files: [{ content: sourceCode }],
    });
    return response.data;
  } catch (err: any) {
    console.error("executeCode error:", err);

    const message =
      err?.response?.data || err?.response?.statusText || err?.message || "Unknown error";
    throw new Error(String(message));
  }
}