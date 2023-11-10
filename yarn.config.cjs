/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require("@yarnpkg/types"); // eslint-disable-line @typescript-eslint/no-var-requires

// https://yarnpkg.com/features/constraints

// Enforce that the engines.node field is properly set in all workspaces
const enforceConsistentEnginesNodeValue = ({ Yarn }) => {
  for (const workspace of Yarn.workspaces()) {
    workspace.set("engines.node", ">=18.17.1");
  }
};

// Enforce that a workspaces depend on the same version of a dependency
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
