import imp from "./dist/index.js"
import tsEslint from "typescript-eslint"

export default [
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser: tsEslint.parser },
  },
  imp.configs.recommended,
]
