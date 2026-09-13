// @ts-check
// https://yarnpkg.com/features/constraints
//
// Must keep this exact name: Yarn 4 loads yarn.config.cjs and nothing else, and
// given any other name it evaluates nothing while still exiting 0

const { defineConfig } = require("@yarnpkg/types");

module.exports = defineConfig({
  // Async because Yarn's constraints type requires that signature
  constraints: async ({ Yarn }) => {
    // Enforce that the engines.node field is properly set in all workspaces
    for (const workspace of Yarn.workspaces()) {
      workspace.set("engines.node", ">=24.18.0");
    }

    // Enforce that workspaces depend on the same version of a dependency
    for (const dependency of Yarn.dependencies()) {
      if (dependency.type === "peerDependencies") {
        continue;
      }

      for (const otherDependency of Yarn.dependencies({
        ident: dependency.ident,
      })) {
        if (otherDependency.type === "peerDependencies") {
          continue;
        }

        dependency.update(otherDependency.range);
      }
    }
  },
});
