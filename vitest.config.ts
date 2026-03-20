import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.test" });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["src/tests/setup.ts"],
    globals: true,
    env: { NODE_ENV: "test" },
    fileParallelism: false,
  },
});
