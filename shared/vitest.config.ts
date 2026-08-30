import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Anything that must come out in the event timezone has to be asserted from
    // a host that is not in it, or the assertion passes whether or not the code
    // applies the timezone at all. UTC matches the server, so a local run and CI
    // agree. Note a TZ=... prefix on the command line is silently ignored on
    // Windows, which is why this is set here.
    env: { TZ: "UTC" },
  },
  resolve: {
    alias: {
      shared: path.resolve(import.meta.dirname, "./"),
    },
  },
});
