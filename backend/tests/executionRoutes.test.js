import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";

const judge0Submission = {
  status: { description: "Accepted" },
  stdout: "Hello\n",
  stderr: null,
  compile_output: null,
  message: null,
  time: "0.01",
  memory: 1024,
};

function stubJudge0(status, body) {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("execution routes", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("lists the runnable languages", async () => {
    const response = await request(app).get("/api/execute/languages").expect(200);

    expect(response.body.languages).toEqual(expect.arrayContaining(["cpp", "c", "go", "python"]));
  });

  it("runs code and returns a normalized result", async () => {
    const fetchMock = stubJudge0(200, judge0Submission);

    const response = await request(app)
      .post("/api/execute")
      .send({ language: "cpp", sourceCode: "int main() {}" })
      .expect(200);

    expect(response.body).toEqual({
      status: "Accepted",
      stdout: "Hello\n",
      stderr: "",
      compileOutput: "",
      message: "",
      time: "0.01",
      memory: 1024,
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ source_code: "int main() {}", language_id: 54 });
    expect(options.headers["X-RapidAPI-Key"]).toBe("test-key");
  });

  it("rejects languages that cannot be run", async () => {
    const response = await request(app)
      .post("/api/execute")
      .send({ language: "markdown", sourceCode: "# hi" })
      .expect(400);

    expect(response.body.message).toBe("Running markdown code is not supported");
  });

  it("does not treat object prototype keys as languages", async () => {
    await request(app)
      .post("/api/execute")
      .send({ language: "constructor", sourceCode: "x" })
      .expect(400);
  });

  it("requires source code", async () => {
    const response = await request(app)
      .post("/api/execute")
      .send({ language: "python", sourceCode: "   " })
      .expect(400);

    expect(response.body.message).toBe("Source code is required");
  });

  it("passes through quota errors from Judge0", async () => {
    stubJudge0(429, { message: "Too many requests" });

    await request(app)
      .post("/api/execute")
      .send({ language: "python", sourceCode: "print(1)" })
      .expect(429);
  });

  it("reports other Judge0 failures as a bad gateway", async () => {
    stubJudge0(500, {});

    const response = await request(app)
      .post("/api/execute")
      .send({ language: "python", sourceCode: "print(1)" })
      .expect(502);

    expect(response.body.message).toBe("Code execution service responded with 500");
  });

  it("explains when no API key is configured", async () => {
    vi.stubEnv("RAPIDAPI_KEY", "");
    vi.resetModules();
    const { createApp: createAppWithoutKey } = await import("../src/app.js");

    const response = await request(createAppWithoutKey())
      .post("/api/execute")
      .send({ language: "python", sourceCode: "print(1)" })
      .expect(503);

    expect(response.body.message).toBe("Code execution is not configured on this server");
  });

  it("rate limits repeated runs from the same client", async () => {
    stubJudge0(200, judge0Submission);
    const send = () =>
      request(app).post("/api/execute").send({ language: "python", sourceCode: "print(1)" });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await send().expect(200);
    }

    const response = await send().expect(429);
    expect(response.body.message).toBe("Too many runs, please wait a minute");
  });
});
