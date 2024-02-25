import { execSync } from "node:child_process"

import { defineConfig } from "vitest/config"

const gitSha = execSync("git rev-parse --short HEAD").toString().trim()
export default defineConfig({
  define: {
    PKG_NAME: "'eslint-plugin-import-v2'",
    PKG_VERSION: "'testing'",
  },

  test: {
    env: {
      GIT_SHA: JSON.stringify(gitSha),
    },

    benchmark: {
      reporters: "verbose",
    },
  },
})
