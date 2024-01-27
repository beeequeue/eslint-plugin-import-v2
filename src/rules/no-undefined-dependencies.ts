import process from "node:process"

import builtins from "builtin-modules"
import { type Rule } from "eslint"
import type { ImportDeclaration } from "estree"
import memoize from "memoize"
import Picomatch from "picomatch"
import { getPackagesSync } from "@manypkg/get-packages"

const onlyImportsTypes = (node: ImportDeclaration) =>
  (node as any).importKind === "type" ||
  node.specifiers.every((specifier) => (specifier as any).importKind === "type")

const createDevFileMatcher = memoize(Picomatch)

let packageCache: Record<"deps" | "devDeps", Set<string>> | null = null
const getDependencyNames = memoize((cwd: string) => {
  if (packageCache != null) return packageCache

  const { packages, rootPackage } = getPackagesSync(cwd ?? process.cwd())

  packageCache = {
    deps: new Set<string>([
      ...Object.keys(rootPackage?.packageJson.dependencies ?? {}),
      ...Object.keys(rootPackage?.packageJson.peerDependencies ?? {}),
      ...packages
        .flatMap((pkg) => [
          ...Object.keys(pkg.packageJson.dependencies ?? {}),
          ...Object.keys(pkg.packageJson.peerDependencies ?? {}),
        ])
        .filter((dep) => !dep.startsWith("@types/")),
    ]),
    devDeps: new Set<string>([
      ...Object.keys(rootPackage?.packageJson.devDependencies ?? {}),
      ...packages
        .flatMap((pkg) => Object.keys(pkg.packageJson.devDependencies ?? {}))
        .filter((dep) => !dep.startsWith("@types/")),
    ]),
  }

  return packageCache
})

type Options = [
  {
    devDependencies?: string[] | boolean
  },
]

const defaultOptions = [
  {
    devDependencies: ["**/*.test.*", "**/*.spec.*", "**/*.stories.*", "**/.storybook/**"],
  },
] satisfies Options

export const noUndefinedDependencies: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Requires external dependencies to be defined in a dependency manifest.",
      recommended: true,
    },
    messages: {
      notFound: "`{{ specifier }}` was not found in any production dependency manifests.",
      devDep: "`{{ specifier }}` can only be imported from development-only files.",
    },
  },

  schema: [
    {
      type: "object",
      properties: {
        devDependencies: {
          type: "array",
          items: { oneOf: [{ type: "string" }, { type: "boolean" }] },
          description:
            "Where development dependencies are allowed to be imported from. Defaults to tests and Storybook files.",
        },
      },
      additionalProperties: false,
    },
  ],

  create(context) {
    const options = (
      context.options.length > 0 ? context.options : defaultOptions
    ) as Options
    const isDevFile =
      options[0].devDependencies != null
        ? !Array.isArray(options[0].devDependencies)
          ? () => options[0].devDependencies
          : createDevFileMatcher(options[0].devDependencies)
        : null

    return {
      async ImportDeclaration(node) {
        const specifier = node.source.value as string
        if (
          specifier.startsWith(".") ||
          specifier.startsWith("node:") ||
          builtins.includes(specifier)
        ) {
          return
        }

        const { deps, devDeps } = getDependencyNames(context.cwd)
        const isDep = deps.has(specifier)
        const isDevDep = devDeps.has(specifier)

        if (isDevDep && !isDep) {
          if (isDevFile?.(context.filename)) return

          return context.report({
            messageId: "devDep",
            data: { specifier },
            node,
            loc: node.source.loc!,
          })
        }

        if (isDep || onlyImportsTypes(node)) return

        context.report({
          messageId: "notFound",
          data: { specifier },
          node,
          loc: node.source.loc!,
        })
      },
    }
  },
}
