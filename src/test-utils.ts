import { RuleTester } from "eslint"

import { afterAll, describe, it } from "vitest"
;(RuleTester as any).afterAll = afterAll
;(RuleTester as any).describe = describe
;(RuleTester as any).describeSkip = describe.skip
;(RuleTester as any).it = it
;(RuleTester as any).itOnly = it.only
;(RuleTester as any).itSkip = it.skip

export const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
})
