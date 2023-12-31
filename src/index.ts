import { ESLint } from "eslint"
import { noDefaultExport } from "./rules/no-default-export.js"
import { noUndefinedDependencies } from "./rules/no-undefined-dependencies.js"

const plugin = {
  meta: {
    name: PKG_NAME,
    version: PKG_VERSION,
  },

  rules: {
    "no-default-export": noDefaultExport,
    "no-undefined-dependencies": noUndefinedDependencies,
  },

  configs: {
    recommended: {
      rules: {
        "no-default-export": "error",
        "no-undefined-dependencies": "error",
      },
    },
  },
} satisfies ESLint.Plugin

Object.assign(plugin, { configs: { recommended: { plugins: { import: plugin } } } })

export default plugin
