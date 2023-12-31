import { type Rule } from "eslint"
import memoize from "memoize"
import Picomatch from "picomatch"
import { getPackagesSync } from "@manypkg/get-packages"
import type { ImportDeclaration } from "estree"

const onlyImportsTypes = (node: ImportDeclaration) =>
  (node as any).importKind === "type" ||
  node.specifiers.every((specifier) => (specifier as any).importKind === "type")

const createDevFileMatcher = memoize(Picomatch)

// const cachedMatchers = new WeakMap<string[], Picomatch.Matcher>()

let packageCache: Record<"deps" | "devDeps", string[]> | null = null
const getDependencyNames = memoize((cwd: string) => {
  if (packageCache != null) return packageCache

  const { packages } = getPackagesSync(cwd ?? process.cwd())

  packageCache = {
    deps: [
      ...new Set<string>(
        packages
          .flatMap((pkg) => [
            ...Object.keys(pkg.packageJson.dependencies ?? {}),
            ...Object.keys(pkg.packageJson.peerDependencies ?? {}),
          ])
          .filter((dep) => !dep.startsWith("@types/")),
      ),
    ],
    devDeps: [
      ...new Set<string>(
        packages
          .flatMap((pkg) => Object.keys(pkg.packageJson.devDependencies ?? {}))
          .filter((dep) => !dep.startsWith("@types/")),
      ),
    ],
  }

  return packageCache
})

type Options = [
  {
    devDependencies?: string[]
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
          items: { type: "string" },
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
        ? createDevFileMatcher(options[0].devDependencies)
        : null

    return {
      async ImportDeclaration(node) {
        const specifier = node.source.value as string
        if (specifier.startsWith(".")) return

        const { deps, devDeps } = getDependencyNames(context.cwd)

        if (devDeps.includes(specifier) && !deps.includes(specifier)) {
          if (isDevFile?.(context.filename)) return

          return context.report({
            messageId: "devDep",
            data: { specifier },
            node,
            loc: node.source.loc!,
          })
        }

        if (deps.includes(specifier) || onlyImportsTypes(node)) return

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
