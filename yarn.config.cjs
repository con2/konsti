/** @type {import('@yarnpkg/types')} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { defineConfig } = require("@yarnpkg/types");

// https://yarnpkg.com/features/constraints

// Enforce that the engines.node field is properly set in all workspaces
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const enforceConsistentEnginesNodeValue = ({ Yarn }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  for (const workspace of Yarn.workspaces()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    workspace.set("engines.node", ">=20.16.0");
  }
};

// Enforce that a workspaces depend on the same version of a dependency
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const enforceConsistentDependencies = ({ Yarn }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  for (const dependency of Yarn.dependencies()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dependency.type === `peerDependencies`) {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const otherDependency of Yarn.dependencies({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access,
      ident: dependency.ident,
    })) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (otherDependency.type === `peerDependencies`) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
