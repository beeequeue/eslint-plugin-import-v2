import { execSync } from "node:child_process"

import { defineConfig } from "tsup"
import { name, version } from "./package.json"

const gitSha = execSync("git rev-parse --short HEAD").toString().trim()

export default defineConfig({
  entry: ["src/**/*.ts", "!**/*.test.*", "src/test-utils.ts"],
  outDir: "dist",

  define: {
    PKG_NAME: JSON.stringify(name),
    PKG_VERSION: JSON.stringify(version),
  },

  env: {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    DEV: (process.env.NODE_ENV === "development") as unknown as string,
    PROD: (process.env.NODE_ENV === "production") as unknown as string,
    TEST: false as unknown as string,
    GIT_SHA: JSON.stringify(gitSha),
  },

  platform: "node",
  target: "node20",
  format: ["esm"],
  esbuildOptions: (options) => {
    options.supported = {
      // For better performance: https://github.com/evanw/esbuild/issues/951
      "object-rest-spread": false,
    }
  },

  bundle: false,
  dts: true,
  clean: true,
  minify: true,
})
