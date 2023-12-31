import imp from "./dist/index.js"
import tsParser from "@typescript-eslint/parser"

export default [
  imp.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
]
