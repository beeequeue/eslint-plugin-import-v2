import dedent from "ts-dedent"

import { ruleTester } from "../test-utils"
import { noDefaultExport } from "./no-default-export.js"

const ruleWithDefaults = { ...noDefaultExport, defaultOptions: [] }

const errors = [{ messageId: "noDefaultExport" }]

ruleTester.run("no-default-export", ruleWithDefaults, {
  valid: [
    dedent`
      const foo = "foo"
      const bar = "bar"
      export { foo, bar }
    `,
    dedent`
      export const foo = "foo"
      const bar = "bar"
    `,
  ],
  invalid: [
    {
      name: "test",
      code: dedent`
        const foo = "foo"
        const bar = "bar"
        export default foo
      `,
      errors,
    },
    {
      name: "test2",
      code: dedent`
        export default {}
      `,
      errors,
    },
  ],
})
