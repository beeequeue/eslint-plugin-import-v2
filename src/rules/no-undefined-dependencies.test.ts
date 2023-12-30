import dedent from "ts-dedent"

import { ruleTester } from "../test-utils"
import { noUndefinedDependencies } from "./no-undefined-dependencies.js"

ruleTester.run("no-undefined-dependencies", noUndefinedDependencies, {
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
