import { describe, expect, it } from "vitest"

import { getDependencyName } from "./utils"

describe("getDependencyName", () => {
  const cases = [
    ["wretch", "wretch"],
    ["wretch/addons/formUrl", "wretch"],
    ["@honojs/node-server", "@honojs/node-server"],
    ["@honojs/node-server/something", "@honojs/node-server"],
  ] as const

  it.each(cases)("should return the name of a dependency", (name, expected) => {
    expect(getDependencyName(name)).toBe(expected)
  })
})
