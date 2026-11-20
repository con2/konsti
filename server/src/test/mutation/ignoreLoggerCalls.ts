// The parts of a Babel path the check below reads, so no Babel types are needed
interface StatementPath {
  node: {
    type: string;
    expression?: {
      type: string;
      callee?: {
        type: string;
        object?: { type: string; name?: string };
      };
    };
  };
}

const isLoggerCall = ({ node }: StatementPath): boolean => {
  const callee = node.expression?.callee;
  return (
    node.type === "ExpressionStatement" &&
    node.expression?.type === "CallExpression" &&
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "logger"
  );
};

// Loaded by StrykerJS from the mutation testing config. A mutant inside a logger call only
// changes what is logged, so it is skipped rather than reported as a surviving one.
export const strykerPlugins = [
  {
    kind: "Ignore",
    name: "loggerCalls",
    value: {
      shouldIgnore: (path: StatementPath): string | undefined => {
        return isLoggerCall(path) ? "Only changes what is logged" : undefined;
      },
    },
  },
];
