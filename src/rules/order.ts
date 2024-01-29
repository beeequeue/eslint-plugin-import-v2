import builtins from "builtin-modules"
import memoize from "memoize"
import type { Rule } from "eslint"
import type { ImportDeclaration, Program, SimpleLiteral } from "estree"
import equal from "fast-deep-equal"

const getSource = (declaration: ImportDeclaration) =>
  (declaration.source as SimpleLiteral).value as string

const importTypes = [
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
      getSource(declaration)[0] !== "." &&
      // not from "@foo/bar"
      getSource(declaration)[0] !== "@" &&
      getSource(declaration)[1] !== "/",
    weight: 1,
  },
  {
    name: "external-scoped",
    predicate: (declaration: ImportDeclaration) =>
      // from "@foo/bar"
      getSource(declaration)[0] === "@" && getSource(declaration)[1] !== "/",
    weight: 2,
  },
  {
    name: "internal-aliased",
    predicate: (declaration: ImportDeclaration) =>
      // from "@/foo/bar", "~/foo/bar"
      getSource(declaration)[1] === "/" &&
      (getSource(declaration)[0] === "@" || getSource(declaration)[0] === "~"),
    weight: 3,
  },
  {
    name: "internal",
    predicate: (declaration: ImportDeclaration) =>
      // from "../foo.js"
      getSource(declaration)[0] === "." && getSource(declaration)[1] === ".",
    weight: 4,
  },
  {
    name: "adjacent",
    predicate: (declaration: ImportDeclaration) =>
      // from "./foo.js"
      getSource(declaration)[0] === "." && getSource(declaration)[1] === "/",
    weight: 5,
  },
] as const

type SourceWithWeight = {
  source: string
  weight: (typeof importTypes)[number]["weight"]
  range: [number, number]
}

const getWeight = memoize((declaration: ImportDeclaration): SourceWithWeight => {
  for (const type of importTypes) {
    if (type.predicate(declaration)) {
      return {
        source: getSource(declaration),
        weight: type.weight,
        range: declaration.range!,
      }
    }
  }

  return {
    source: getSource(declaration),
    weight: 100 as never,
    range: declaration.range!,
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

export const order: Rule.RuleModule = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description: "Enforces the ordering of import statements.",
      recommended: true,
    },
    messages: {
      badOrder: "Imports are not ordered correctly.",
    },
  },

  create(context) {
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
          messageId: "badOrder",
          loc: {
            start: importDeclarations[0].loc!.start,
            end: importDeclarations.at(-1)!.loc!.end,
          },
          fix: (fixer) => [
            fixer.removeRange([
              importDeclarations[0].range![0],
              importDeclarations.at(-1)!.range![1],
            ]),
            fixer.insertTextBefore(
              node,
              properlySorted
                .map(
                  ({ weight, range }, index) =>
                    context.sourceCode.getText({
                      type: "ImportDeclaration",
                      range,
                    } as never) +
                    (properlySorted[index + 1] != null &&
                    properlySorted[index + 1]?.weight !== weight
                      ? "\n"
                      : ""),
                )
                .join("\n"),
            ),
          ],
        })
      },
    }
  },
}
