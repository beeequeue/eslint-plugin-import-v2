import builtins from "builtin-modules"
import type { Rule } from "eslint"
import type { Comment, ImportDeclaration, Program } from "estree"
import equal from "fast-deep-equal"

const importTypes = [
  {
    name: "node",
    predicate: (source: string) =>
      source.startsWith("node:") || builtins.includes(source),
    weight: 0,
  },
  {
    name: "external",
    predicate: (source: string) =>
      // not from "../foo.js", "./foo.js"
      source[0] !== "." &&
      // not from "@foo/bar"
      source[0] !== "@" &&
      source[1] !== "/",
    weight: 1,
  },
  {
    name: "external-scoped",
    predicate: (source: string) =>
      // from "@foo/bar"
      source[0] === "@" && source[1] !== "/",
    weight: 2,
  },
  {
    name: "internal-aliased",
    predicate: (source: string) =>
      // from "@/foo/bar", "~/foo/bar"
      source[1] === "/" && (source[0] === "@" || source[0] === "~"),
    weight: 3,
  },
  {
    name: "internal",
    predicate: (source: string) =>
      // from "../foo.js"
      source[0] === "." && source[1] === ".",
    weight: 4,
  },
  {
    name: "adjacent",
    predicate: (source: string) =>
      // from "./foo.js"
      source[0] === "." && source[1] === "/",
    weight: 5,
  },
] as const

type ImportDeclarationWithComments = ImportDeclaration & {
  newLinesBefore: number
  comments: Comment[]
}

type SourceWithWeight = {
  source: string
  weight: (typeof importTypes)[number]["weight"]
  newLinesBefore: number
  originalIndex: number
}

const getWeight = (
  declaration: ImportDeclarationWithComments,
  index: number,
): SourceWithWeight => {
  const source = declaration.source.value as string

  for (const type of importTypes) {
    if (type.predicate(source)) {
      return {
        source: source,
        weight: type.weight,
        newLinesBefore: declaration.newLinesBefore,
        originalIndex: index,
      }
    }
  }

  return {
    source: source,
    weight: 100 as never,
    newLinesBefore: declaration.newLinesBefore,
    originalIndex: index,
  }
}

const getImportDeclarations = (
  context: Rule.RuleContext,
  program: Program,
): ImportDeclarationWithComments[] => {
  const importDeclarations: ImportDeclarationWithComments[] = []

  let foundImportDeclaration = false
  // for instead of forof for performance
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

    const newLinesBefore =
      child.loc!.start.line - 1 - (importDeclarations.at(-1)?.loc!.end.line ?? 0)

    importDeclarations.push({
      ...child,
      newLinesBefore,
      comments: context.sourceCode.getCommentsBefore(child),
    })
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
        const importDeclarations = getImportDeclarations(context, node)

        const weights = importDeclarations.map(getWeight)
        const properlySorted = weights
          .toSorted((a, b) => {
            if (a.weight !== b.weight) {
              return a.weight - b.weight
            } else {
              return a.source.localeCompare(b.source, "en-US")
            }
          })
          // Set newLinesBefore to correct value based on sections
          .map((value, index, array) => {
            const previous = array[index - 1]

            return {
              ...value,
              newLinesBefore: previous != null && previous.weight !== value.weight ? 1 : 0,
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
              importDeclarations[0].comments?.[0]?.range?.[0] ??
                importDeclarations[0].range![0],
              importDeclarations.at(-1)!.range![1],
            ]),
            fixer.insertTextBeforeRange(
              importDeclarations[0].comments?.[0]?.range ?? importDeclarations[0].range!,
              properlySorted
                .map(({ weight, originalIndex }, index) => {
                  const originalDeclaration = importDeclarations[originalIndex]
                  let sourceCode = context.sourceCode.getText(originalDeclaration)

                  if (
                    properlySorted[index + 1] != null &&
                    properlySorted[index + 1]?.weight !== weight
                  ) {
                    sourceCode += "\n"
                  }

                  if (originalDeclaration.comments.length !== 0) {
                    sourceCode =
                      originalDeclaration.comments
                        .map((comment) => context.sourceCode.getText(comment))
                        .join("\n") +
                      "\n" +
                      sourceCode
                  }

                  return sourceCode
                })
                .join("\n"),
            ),
          ],
        })
      },
    }
  },
}
