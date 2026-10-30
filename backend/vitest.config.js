import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      RAPIDAPI_KEY: "test-key",
      CLIENT_ORIGIN: "",
    },
  },
});
