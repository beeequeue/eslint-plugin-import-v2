import Picomatch from "picomatch"
import memoize from "memoize"
import pMemoize from "p-memoize"
import { getPackages } from "@manypkg/get-packages"
import { Rule } from "eslint"

const createDevFileMatcher = memoize(Picomatch)

// const cachedMatchers = new WeakMap<string[], Picomatch.Matcher>()

const getDependencyNames = pMemoize(async (cwd: string) => {
  const { packages } = await getPackages(cwd ?? process.cwd())

  return {
    deps: new Set<string>(
      packages
        .flatMap((pkg) => Object.keys(pkg.packageJson.dependencies ?? {}))
        .filter((dep) => !dep.startsWith("@types/")),
    ),
    devDeps: new Set<string>(
      packages
        .flatMap((pkg) => Object.keys(pkg.packageJson.devDependencies ?? {}))
        .filter((dep) => !dep.startsWith("@types/")),
    ),
  }
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
      notFound: "This dependency was not found in any dependency manifests.",
      devDep:
        "This development dependency can only be imported from development-only files.",
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
      context.options.length !== 0 ? context.options : defaultOptions
    ) as Options
    const isDevFile =
      options[0].devDependencies != null
        ? createDevFileMatcher(options[0].devDependencies)
        : null

    return {
      async ImportDeclaration(node) {
        const specifier = node.source.value as string
        if (specifier.startsWith(".")) return

        const { deps, devDeps } = await getDependencyNames(context.cwd)

        if (!deps.has(specifier)) {
          return context.report({
            node: node.source,
            messageId: "notFound",
          })
        }

        if (
          !specifier.startsWith("@types/") &&
          isDevFile?.(context.filename) &&
          !devDeps.has(specifier)
        ) {
          context.report({
            node,
            messageId: "devDep",
          })
        }
      },
    }
  },
}
