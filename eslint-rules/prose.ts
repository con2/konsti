import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
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

// The unhyphenated spelling as a word of its own or opening a compound like `signup-time`. One
// that ends a compound, like an endpoint name, is left alone, and so are a URL path segment and
// a camelCase identifier such as directSignup or signUp.
const signup: Check = {
  pattern: /(?<![\w/-])[sS]ignups?(?!\w)/gu,
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

// URLs, and in code the backticked spans, name things that keep their own spelling. Blanked
// rather than removed, so the offsets of what is left still match the source.
const urlPattern = /https?:\/\/[^\s)>\]]+/gu;
const codeSpanOrUrlPattern = /`[^`\n]*`|https?:\/\/[^\s)>\]]+/gu;

const blank = (text: string, pattern: RegExp): string => {
  return text.replaceAll(pattern, (span) => {
    return " ".repeat(span.length);
  });
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
  if (callee.type === "TaggedTemplateExpression") {
    return rootCalleeName(callee.tag);
  }
  return undefined;
};

const stringNodes = (node: EstreeNode | null | undefined): EstreeNode[] => {
  if (node?.type === "Literal" && typeof node.value === "string") {
    return [node];
  }
  return node?.type === "TemplateLiteral" ? [node] : [];
};

const titleKeysOf = (titleText: string): Set<string> => {
  return new Set([...titleText.matchAll(/\$(\w+)/gu)].map((match) => match[1]));
};

// The rows of a `test.each(table)("$case" / "%s")` table hold the real test names: an object
// row's properties named in the title, or an array row's string elements
const tableTitleNodes = (
  table: EstreeNode,
  titleText: string,
): EstreeNode[] => {
  if (table.type !== "ArrayExpression") {
    return [];
  }
  const titleKeys = titleKeysOf(titleText);
  // %% is a literal percent sign rather than a placeholder
  const positions =
    titleText.replaceAll("%%", "").match(/%[sdifjoOc]/gu)?.length ?? 0;
  return table.elements.flatMap((row) => {
    if (row?.type === "ObjectExpression") {
      return row.properties.flatMap((property) => {
        if (property.type !== "Property") {
          return [];
        }
        const key =
          property.key.type === "Identifier"
            ? property.key.name
            : String((property.key as { value?: unknown }).value);
        return titleKeys.has(key) ? stringNodes(property.value) : [];
      });
    }
    // An array row's elements print through the placeholders in order, or by index as $0, $1
    if (row?.type === "ArrayExpression") {
      return row.elements
        .filter((_element, index) => {
          return index < positions || titleKeys.has(String(index));
        })
        .flatMap((element) => stringNodes(element));
    }
    return positions > 0 ? stringNodes(row) : [];
  });
};

// A tagged-template table names its columns in a header line and fills them in order, so a
// value's column is its position modulo the column count
const taggedTableTitleNodes = (
  table: EstreeNode,
  titleText: string,
): EstreeNode[] => {
  if (table.type !== "TemplateLiteral") {
    return [];
  }
  const columns = (table.quasis.at(0)?.value.raw ?? "")
    .trim()
    .split("|")
    .map((column) => column.trim());
  const titleKeys = titleKeysOf(titleText);
  return table.expressions.flatMap((expression, index) => {
    return titleKeys.has(columns[index % columns.length])
      ? stringNodes(expression)
      : [];
  });
};

const tableFunctions = new Set(["each", "for"]);

// The table of a test.each or test.for call, given as an argument or as a tagged template
const tableOf = (callee: EstreeNode): EstreeNode | undefined => {
  const member =
    callee.type === "CallExpression"
      ? callee.callee
      : callee.type === "TaggedTemplateExpression"
        ? callee.tag
        : undefined;
  if (
    member?.type !== "MemberExpression" ||
    member.property.type !== "Identifier" ||
    !tableFunctions.has(member.property.name) ||
    !testFunctions.has(rootCalleeName(member.object) ?? "")
  ) {
    return undefined;
  }
  return callee.type === "TaggedTemplateExpression"
    ? callee.quasi
    : (callee as { arguments: EstreeNode[] }).arguments.at(0);
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
        const searched =
          check === signup ? blank(text, codeSpanOrUrlPattern) : text;
        for (const match of searched.matchAll(check.pattern)) {
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

    const checkString = (node: EstreeNode, checks: Check[]): void => {
      if (node.type === "Literal") {
        checkNode(node, node.raw ?? "", checks);
      } else if (node.type === "TemplateLiteral") {
        for (const quasi of node.quasis) {
          checkNode(quasi, quasi.value.raw, checks, 1);
        }
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
          checkString(node, stringChecks(node));
        }
      },

      TemplateLiteral: (node) => {
        checkString(node, stringChecks(node));
      },

      // Only the `signup` check, since every string already gets the others
      CallExpression: (node) => {
        const title = node.arguments.at(0);
        const table = tableOf(node.callee);
        if (!title || !table) {
          return;
        }
        const titleText =
          title.type === "Literal"
            ? String(title.value)
            : title.type === "TemplateLiteral"
              ? title.quasis.map((quasi) => quasi.value.raw).join("")
              : "";
        for (const titleNode of [
          ...tableTitleNodes(table, titleText),
          ...taggedTableTitleNodes(table, titleText),
        ]) {
          checkString(titleNode, [signup]);
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
    // The source rather than the decoded value, which drops blockquote markers, list
    // indentation and escapes, so its offsets drift from the file's
    const checkSource = (
      position: { start: { offset?: number }; end: { offset?: number } },
      prepare: (source: string) => string = (source) => source,
    ): void => {
      const { offset: start } = position.start;
      const { offset: end } = position.end;
      if (start === undefined || end === undefined) {
        return;
      }
      const source = prepare(context.sourceCode.text.slice(start, end));
      for (const check of [emDash, fcfs, signup]) {
        const searched = check === signup ? blank(source, urlPattern) : source;
        for (const match of searched.matchAll(check.pattern)) {
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
    };

    // Inline HTML splits into an opening tag, plain text and a closing tag, so the text between an
    // inline code or pre element's tags is skipped by tracking which one is open. Inline HTML
    // can't span blocks, so the flag is set only inside one and an unclosed one ends with it.
    let insideInlineCode = false;
    let phrasingDepth = 0;
    const startBlock = (): void => {
      phrasingDepth += 1;
    };
    const endBlock = (): void => {
      phrasingDepth -= 1;
      insideInlineCode = false;
    };

    return {
      text: (node) => {
        if (node.position && !insideInlineCode) {
          checkSource(node.position);
        }
      },

      paragraph: startBlock,
      heading: startBlock,
      tableCell: startBlock,
      "paragraph:exit": endBlock,
      "heading:exit": endBlock,
      "tableCell:exit": endBlock,

      // Raw HTML is one node, text and tags together, so the tags are blanked out first
      html: (node) => {
        // An opening tag that isn't self-closing, and a closing one that may carry whitespace
        if (
          phrasingDepth > 0 &&
          /^<(?:code|pre)(?=[\s/>])[^>]*(?<!\/)>$/iu.test(node.value)
        ) {
          insideInlineCode = true;
        } else if (/^<\/(?:code|pre)\s*>$/iu.test(node.value)) {
          insideInlineCode = false;
        }
        if (node.position) {
          checkSource(node.position, (source) =>
            source.replaceAll(
              // Comments and code elements whole, then the remaining tags, skipping a > inside a
              // quoted attribute value. A tag name only counts as code or pre where it ends.
              /<!--[\s\S]*?-->|<(code|pre)(?=[\s/>])[\s\S]*?<\/\1\s*>|<(?:[^>"']|"[^"]*"|'[^']*')*>/giu,
              (tag) => " ".repeat(tag.length),
            ),
          );
        }
      },
    };
  },
};

// ESLint's cache knows a plugin by its name and version rather than its code, so the version
// is a hash of the rules' source and editing a rule re-lints every file
const rulesSourceHash = (): string => {
  const hash = createHash("sha256");
  const files = readdirSync(import.meta.dirname, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .toSorted((a, b) => a.localeCompare(b));
  for (const file of files) {
    hash.update(readFileSync(path.join(import.meta.dirname, file)));
  }
  return hash.digest("hex").slice(0, 16);
};

export const konstiPlugin = {
  meta: { name: "eslint-plugin-konsti", version: rulesSourceHash() },
  rules: { prose: proseRule, "markdown-prose": markdownProseRule },
};
