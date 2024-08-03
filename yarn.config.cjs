/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require("@yarnpkg/types");

// https://yarnpkg.com/features/constraints

// Enforce that the engines.node field is properly set in all workspaces
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const enforceConsistentEnginesNodeValue = ({ Yarn }) => {
  for (const workspace of Yarn.workspaces()) {
    workspace.set("engines.node", ">=20.16.0");
  }
};

// Enforce that a workspaces depend on the same version of a dependency
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const enforceConsistentDependencies = ({ Yarn }) => {
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === `peerDependencies`) {
      continue;
    }

    for (const otherDependency of Yarn.dependencies({
      ident: dependency.ident,
    })) {
      if (otherDependency.type === `peerDependencies`) {
        continue;
      }

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
