import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.test" });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    env: { NODE_ENV: "test" },
    fileParallelism: false,
    include: ["**/*.test.ts", "**/*.unit.test.ts", "**/*.db.test.ts"],
    exclude: ["**/.claude/**", "**/node_modules/**"],
  },
});
