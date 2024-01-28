import builtins from "builtin-modules"
import memoize from "memoize"
import type { Rule } from "eslint"
import type { ImportDeclaration, Program, SimpleLiteral } from "estree"
import equal from "fast-deep-equal"

const getSource = (declaration: ImportDeclaration) =>
  (declaration.source as SimpleLiteral).value as string

const types = [
  {
    name: "node",
    predicate: (declaration: ImportDeclaration) =>
      getSource(declaration).startsWith("node:") ||
      builtins.includes(getSource(declaration)),
    weight: 0,
  },
  {
    name: "external",
    predicate: (declaration: ImportDeclaration) =>
      // not from "../foo.js", "./foo.js"
      getSource(declaration)[0] !== "." ||
      // from "@foo/bar"
      (getSource(declaration)[0] === "@" && getSource(declaration)[1] !== "/"),
    weight: 1,
  },
  {
    name: "internal",
    predicate: (declaration: ImportDeclaration) =>
      // from "../foo.js"
      (getSource(declaration)[0] === "." && getSource(declaration)[1] === ".") ||
      // from "@/foo/bar", "~/foo/bar"
      (getSource(declaration)[1] === "/" &&
        (getSource(declaration)[0] === "@" || getSource(declaration)[0] === "~")),
    weight: 2,
  },
  {
    name: "adjacent",
    predicate: (declaration: ImportDeclaration) =>
      // from "./foo.js"
      getSource(declaration)[0] === "." && getSource(declaration)[1] === "/",
    weight: 3,
  },
] as const

type SourceWithWeight = {
  source: string
  weight: (typeof types)[number]["weight"]
}

const getWeight = memoize((declaration: ImportDeclaration): SourceWithWeight => {
  for (const type of types) {
    if (type.predicate(declaration)) {
      return {
        source: getSource(declaration),
        weight: type.weight,
      }
    }
  }

  return {
    source: getSource(declaration),
    weight: 100 as never,
  }
})

const getImportDeclarations = (program: Program): ImportDeclaration[] => {
  const importDeclarations: ImportDeclaration[] = []

  let foundImportDeclaration = false
  // for instead of forof for performance & `break`
  for (let i = 0; i < program.body.length; i++) {
    const child = program.body[i]
    if (child.type !== "ImportDeclaration") {
      if (foundImportDeclaration) {
        break
      } else {
        continue
      }
    }

    if (child.specifiers.length === 0) continue

    if (!foundImportDeclaration) {
      foundImportDeclaration = true
    }

    importDeclarations.push(child)
  }

  return importDeclarations
}

type Options = []

export const order: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforces the ordering of import statements.",
      recommended: true,
    },
    messages: {
      badOrder: "Imports are not ordered correctly.",
    },
  },

  schema: [],

  create(context) {
    const options = context.options as Options

    return {
      ["Program:exit"](node) {
        const importDeclarations = getImportDeclarations(node)

        const weights = importDeclarations.map(getWeight)
        const properlySorted = weights.toSorted((a, b) => {
          if (a.weight === b.weight) {
            return a.source.localeCompare(b.source, "en-US")
          } else {
            return a.weight - b.weight
          }
        })

        if (equal(weights, properlySorted)) return

        context.report({
          loc: importDeclarations[0].loc!,
          messageId: "badOrder",
        })
      },
    }
  },
}
