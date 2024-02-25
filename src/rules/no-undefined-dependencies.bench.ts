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
    import { escape, unescape } from "html-escaper"
    import { ListrTask } from "listr2"
    import pRetry from "p-retry"
    import { chunk } from "remeda"

    import { fakeTranslate, TranslateContext, TranslateEntry } from "@bt/plugin-util"

    import { LANGUAGES } from "../constants.js"
    import { GCloud } from "../lib/gcloud/index.js"
    import { initQueue, QUEUE_NAME } from "../lib/rabbitmq.js"
    import { splitIntoLines, unwrapPromise } from "../utils.js"

    console.log("test")
  `,
  dedent`
    import assert from "node:assert"
    import fs from "node:fs"
    import http2 from "node:http2"

    import { expect } from "vitest"

    import { biz } from "../biz"
    import { foo } from "@/foo"
    import { bar } from "~/bar"

    import { baz } from "./baz"

    console.log("test")
  `,
  dedent`
    /* comment about biz */
    import { biz } from "../biz"

    // comment about baz
    import { baz } from "./baz"

    console.log("test")
  `,
]

describe("no-undefined-dependencies", () => {
  const v1 = new ESLint({
    cache: false,
    // @ts-expect-error: Missing types
    overrideConfigFile: true,
    // @ts-expect-error: Missing types
    overrideConfig: [
      {
        plugins: { import: imp },
        rules: { "import/no-extraneous-dependencies": "error" },
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
        rules: { "import/no-undefined-dependencies": "error" },
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
