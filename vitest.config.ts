import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    // Resolves the `@/*` alias from tsconfig.json.
    tsconfigPaths: true,
  },
});
