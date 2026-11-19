import type { MarkdownRuleDefinition } from "@eslint/markdown";
import type { AST, Rule } from "eslint";
import type { Node as EstreeNode } from "estree";

interface Check {
  // Global, so every occurrence is reported rather than the first
  pattern: RegExp;
  message: string;
}

const emDash: Check = {
  pattern: /—/gu,
  message: "Use a hyphen (-) or restructure the sentence instead of an em dash",
};

const fcfs: Check = {
  pattern: /\bFCFS\b/gu,
  message: 'Write "first-come-first-served" in full',
};

// The unhyphenated spelling as a word of its own. A hyphenated compound like an
// endpoint name is left alone, and so is an identifier, which has no word boundary.
const signup: Check = {
  pattern: /(?<![\w-])signups?(?![\w-])/giu,
  message: 'Write "sign-up" in prose, and say which: lottery or direct',
};

const claudeMdReference: Check = {
  pattern: /CLAUDE\.md/giu,
  message: "State the constraint here instead of pointing at a CLAUDE.md",
};

const designRuleNumber: Check = {
  pattern: /\brules? \d+\b/giu,
  message: "State the rule's substance, rule numbers change",
};

const testFunctions = new Set(["describe", "it", "test", "suite", "bench"]);

const testModifiers = new Set([
  "skip",
  "only",
  "todo",
  "concurrent",
  "sequential",
  "fails",
  "each",
  "for",
  "skipIf",
  "runIf",
  "step",
  "fixme",
  "slow",
  "serial",
  "parallel",
  // Playwright groups tests with test.describe
  "describe",
]);

// Walks `test.skip(...)`, `it.each(table)(...)` and the like down to the name, through the
// modifiers alone, so a call like `test.info().attach(...)` is not taken for a test
const rootCalleeName = (callee: EstreeNode): string | undefined => {
  if (callee.type === "Identifier") {
    return callee.name;
  }
  if (callee.type === "MemberExpression") {
    return callee.property.type === "Identifier" &&
      testModifiers.has(callee.property.name)
      ? rootCalleeName(callee.object)
      : undefined;
  }
  if (callee.type === "CallExpression") {
    return rootCalleeName(callee.callee);
  }
  return undefined;
};

const proseRule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce the project's wording rules in comments, strings and test names",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowClaudeMdReferences: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },

  create: (context) => {
    const options = (context.options[0] ?? {}) as {
      allowClaudeMdReferences?: boolean;
    };
    const { sourceCode } = context;
    const isLocaleFile = /[\\/]locales[\\/][^\\/]+\.ts$/u.test(
      context.filename,
    );

    const reportMatches = (
      text: string,
      textStart: number,
      checks: Check[],
    ): void => {
      for (const check of checks) {
        for (const match of text.matchAll(check.pattern)) {
          const start = textStart + match.index;
          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(start),
              end: sourceCode.getLocFromIndex(start + match[0].length),
            },
            message: check.message,
          });
        }
      }
    };

    // The offset skips a delimiter the node range includes but its text does not
    const checkNode = (
      node: EstreeNode,
      text: string,
      checks: Check[],
      offset = 0,
    ): void => {
      const range = (node as { range?: AST.Range }).range;
      if (range) {
        reportMatches(text, range[0] + offset, checks);
      }
    };

    const isTestTitle = (node: EstreeNode): boolean => {
      const parent = (node as Rule.Node).parent;
      if (parent?.type !== "CallExpression") {
        return false;
      }
      return (
        parent.arguments[0] === node &&
        testFunctions.has(rootCalleeName(parent.callee) ?? "")
      );
    };

    const stringChecks = (node: EstreeNode): Check[] => {
      return isLocaleFile || isTestTitle(node)
        ? [emDash, fcfs, signup]
        : [emDash, fcfs];
    };

    return {
      Program: () => {
        const commentChecks = options.allowClaudeMdReferences
          ? [emDash, fcfs, signup, designRuleNumber]
          : [emDash, fcfs, signup, designRuleNumber, claudeMdReference];
        for (const comment of sourceCode.getAllComments()) {
          if (comment.range) {
            // The text starts after the opening // or /*
            reportMatches(comment.value, comment.range[0] + 2, commentChecks);
          }
        }
      },

      Literal: (node) => {
        if (typeof node.value === "string") {
          checkNode(node, node.raw ?? "", stringChecks(node));
        }
      },

      TemplateLiteral: (node) => {
        const checks = stringChecks(node);
        for (const quasi of node.quasis) {
          checkNode(quasi, quasi.value.raw, checks, 1);
        }
      },

      // The source rather than the decoded value, whose offsets drift after an entity
      JSXText: (node: EstreeNode) => {
        checkNode(node, sourceCode.getText(node), [emDash, fcfs, signup]);
      },
    };
  },
};

// Code spans, code blocks and link targets are nodes of their own, so only the
// prose itself is checked
const markdownProseRule: MarkdownRuleDefinition = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce the project's wording rules in Markdown prose",
    },
  },

  create: (context) => {
    return {
      text: (node) => {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        if (start === undefined || end === undefined) {
          return;
        }
        // The source rather than the decoded value, which drops blockquote markers, list
        // indentation and escapes, so its offsets drift from the file's
        const source = context.sourceCode.text.slice(start, end);
        for (const check of [emDash, fcfs, signup]) {
          for (const match of source.matchAll(check.pattern)) {
            const matchStart = start + match.index;
            context.report({
              loc: {
                start: context.sourceCode.getLocFromIndex(matchStart),
                end: context.sourceCode.getLocFromIndex(
                  matchStart + match[0].length,
                ),
              },
              message: check.message,
            });
          }
        }
      },
    };
  },
};

export const konstiPlugin = {
  rules: { prose: proseRule, "markdown-prose": markdownProseRule },
};
