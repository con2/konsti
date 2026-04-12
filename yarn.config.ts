import { defineConfig } from "@yarnpkg/types";

// https://yarnpkg.com/features/constraints

export default defineConfig({
  constraints: ({ Yarn }) => {
    // Enforce that the engines.node field is properly set in all workspaces
    for (const workspace of Yarn.workspaces()) {
      workspace.set("engines.node", ">=24.14.1");
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
