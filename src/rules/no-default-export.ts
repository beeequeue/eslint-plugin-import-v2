import { Rule } from "eslint"

type Options = [
  {
    includeConfigFiles?: boolean
  },
]

export const noDefaultExport: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallows default exports.",
      recommended: true,
    },
    messages: {
      noDefaultExport: "Default exports are not allowed.",
    },
  },

  schema: [
    {
      type: "object",
      properties: {
        includeConfigFiles: {
          type: "boolean",
          description:
            "Include config files that usually require using default exports, e.g. `vite.config.ts`",
        },
      },
      additionalProperties: false,
    },
  ],

  create(context) {
    const options = context.options as Options
    if (!options[0]?.includeConfigFiles && context.filename.includes(".config.")) {
      return {}
    }

    return {
      ExportDefaultDeclaration(node) {
        context.report({
          node,
          messageId: "noDefaultExport",
          loc: {
            start: node.loc!.start,
            end: node.declaration.loc!.end,
          },
        })
      },
    }
  },
}
