import dedent from "ts-dedent"

import { ruleTester } from "../test-utils.js"
import { order } from "./order.js"

const ruleWithDefaults = { ...order }

const errors = [{ messageId: Object.keys(order.meta!.messages!)[0] }]

ruleTester.run("import-order", ruleWithDefaults, {
  valid: [
    {
      name: "one (node, alphabetical)",
      code: dedent`
        import assert from "node:assert"
        import fs from "node:fs"
        import http2 from "node:http2"
      `,
    },
    {
      name: "two ()",
      code: dedent`
      `,
    },
    {
      name: "three (all)",
      code: dedent`
        import assert from "node:assert"
        import fs from "node:fs"
        import http2 from "node:http2"
        
        import { expect } from "vitest"
        
        import { foo } from "@/foo"
        import { bar } from "~/bar"
        import { biz } from "../biz"
        
        import { baz } from "./baz"
      `,
    },
    {
      name: "example from bad-translator",
      code: dedent`
        import { escape, unescape } from "html-escaper"
        import { ListrTask } from "listr2"
        import pRetry from "p-retry"
        import { chunk } from "remeda"
        
        import { fakeTranslate, TranslateContext, TranslateEntry } from "@bt/plugin-util"
        
        import { LANGUAGES } from "../constants.js"
        import { GCloud } from "../lib/gcloud/index.js"
        import { initQueue, QUEUE_NAME } from "../lib/rabbitmq.js"
        import { splitIntoLines, unwrapPromise } from "../utils.js"
      `,
    },
  ],
  invalid: [
    {
      name: "node alphabetical",
      code: dedent`
        import fs from "node:fs"
        import assert from "node:assert"
        import http2 from "node:http2"
      `,
      errors,
    },
    {
      name: "one",
      code: dedent`
        import assert from "node:assert"
        import fs from "node:fs"
        import { expect } from "vitest"
        
        import http2 from "node:http2"
        
        import { foo } from "@/foo"
        import { bar } from "~/bar"
        import { biz } from "../biz"
        
        import { baz } from "./baz"
      `,
      errors,
    },
    {
      name: "two",
      code: dedent`
        import assert from "node:assert"
        import fs from "node:fs"
        import http2 from "node:http2"
        
        import { expect } from "vitest"
        
        import { biz } from "../biz"
        import { foo } from "@/foo"
        import { bar } from "~/bar"
        
        import { baz } from "./baz"
      `,
      errors,
    },
    {
      name: "three",
      code: dedent`
        import { baz } from "./baz"
        import { biz } from "../biz"
        import { foo } from "@/foo"
        import { bar } from "~/bar"
      `,
      errors,
    },
    {
      name: "four",
      code: dedent`
        import { baz } from "./baz"
        import { biz } from "../biz"
        import { foo } from "@/foo"
        import { bar } from "~/bar"
        
        import assert from "node:assert"
        import fs from "node:fs"
        import http2 from "node:http2"
      `,
      errors,
    },
  ],
})
