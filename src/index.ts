import { ESLint } from "eslint"
import { noDefaultExport } from "./rules/no-default-export"

export default {
  meta: {
    name: PKG_NAME,
    version: PKG_VERSION,
  },

  rules: {
    "no-default-export": noDefaultExport as never,
  },

  configs: {
    recommended: {
      rules: {
        "no-default-export": "error",
      },
    },
  },
} satisfies ESLint.Plugin
