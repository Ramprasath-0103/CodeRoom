import { api } from "./api";

export async function executeCode(language: string, sourceCode: string) {
  try {
    const response = await api.post("/execute", {
      language,
      sourceCode,
    });

    return response.data;
  } catch (err: any) {
    console.error("executeCode error:", err);

    const message =
      err?.response?.data?.message || err?.response?.statusText || err?.message || "Unknown error";
    throw new Error(String(message));
  }
}
