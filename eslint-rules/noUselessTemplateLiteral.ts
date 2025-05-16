import { AST_NODE_TYPES, TSESLint } from "@typescript-eslint/utils";

export const noUselessTemplateLiteral: TSESLint.RuleModule<"replaceWithDoubleQuotes"> =
  {
    meta: {
      type: "suggestion",
      docs: {
        description:
          "Disallow template literals without interpolations, except in tagged or multiline templates.",
      },
      fixable: "code",
      schema: [],
      messages: {
        replaceWithDoubleQuotes:
          "Avoid template literals without interpolations. Use double-quoted strings instead.",
      },
    },

    defaultOptions: [],

    create(context) {
      return {
        TemplateLiteral(node) {
          // Skip if interpolated
          if (node.expressions.length > 0) return;

          const parent = node.parent;

          // Skip if tagged (e.g. styled.div`...`, String.raw`...`)
          if (parent.type === AST_NODE_TYPES.TaggedTemplateExpression) return;

          const raw = node.quasis.map((q) => q.value.raw).join("");

          // Skip multiline strings
          const isMultiline = context.sourceCode.getText(node).includes("\n");

          if (isMultiline) return;

          // Auto-fix to double-quoted string, escaping inner quotes
          const escaped = raw.replaceAll('"', String.raw`\"`);

          context.report({
            node,
            messageId: "replaceWithDoubleQuotes",
            fix(fixer) {
              return fixer.replaceText(node, `"${escaped}"`);
            },
          });
        },
      };
    },
  };
