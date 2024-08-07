/** @type {import('@yarnpkg/types')} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { defineConfig } = require("@yarnpkg/types");

// https://yarnpkg.com/features/constraints

// Enforce that the engines.node field is properly set in all workspaces
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const enforceConsistentEnginesNodeValue = ({ Yarn }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  for (const workspace of Yarn.workspaces()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    workspace.set("engines.node", ">=20.16.0");
  }
};

// Enforce that a workspaces depend on the same version of a dependency
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const enforceConsistentDependencies = ({ Yarn }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === `peerDependencies`) {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    for (const otherDependency of Yarn.dependencies({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ident: dependency.ident,
    })) {
      if (otherDependency.type === `peerDependencies`) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      dependency.update(otherDependency.range);
    }
  }
};

module.exports = defineConfig({
  constraints: (ctx) => {
    enforceConsistentEnginesNodeValue(ctx);
    enforceConsistentDependencies(ctx);
  },
});
