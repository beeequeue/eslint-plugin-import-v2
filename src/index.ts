import { type ESLint } from "eslint"

export default {
  meta: {
    name: PKG_NAME,
    version: PKG_VERSION,
  },

  environments: {},
} satisfies ESLint.Plugin
