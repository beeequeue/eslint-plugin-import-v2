import { ESLint } from "eslint"
// @ts-expect-error: Missing types
import imp from "eslint-plugin-import"
import dedent from "ts-dedent"
import { bench, describe } from "vitest"
// @ts-ignore: Missing types
import imp2 from "../../dist/index"

// TODO: write proper files and mock package.json:s for this

const files = [
  dedent`
    const foo = "foo"
    const bar = "bar"
    export { foo, bar }
  `,
  dedent`
    export const foo = "foo"
    const bar = "bar"
  `,
  dedent`
    const foo = "foo"
    const bar = "bar"
    export default foo
  `,
  dedent`
    export default {}
  `,
]

describe("no-default-export", () => {
  const v1 = new ESLint({
    cache: false,
    // @ts-expect-error: Missing types
    overrideConfigFile: true,
    // @ts-expect-error: Missing types
    overrideConfig: [
      {
        plugins: { import: imp },
        rules: { "import/no-default-export": "error" },
      },
    ],
  })
  const v2 = new ESLint({
    cache: false,
    // @ts-expect-error: Missing types
    overrideConfigFile: true,
    // @ts-expect-error: Missing types
    overrideConfig: [
      {
        plugins: { import: imp2 },
        rules: { "import/no-default-export": "error" },
      },
    ],
  })

  bench(
    "eslint-plugin-import",
    async () => {
      for (const file of files) {
        await v1.lintText(file)
      }
    },
    { warmupIterations: 50, iterations: 500 },
  )

  bench(
    "eslint-plugin-import-v2",
    async () => {
      for (const file of files) {
        await v2.lintText(file)
      }
    },
    { warmupIterations: 50, iterations: 1000 },
  )
})
