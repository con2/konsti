import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import browserstackLocal from "browserstack-local";
import type { TestProject } from "vitest/node";
import { checkLocalServers, seed } from "./utils/testServer.ts";

declare module "vitest" {
  export interface ProvidedContext {
    browserstack: {
      user: string;
      key: string;
      localIdentifier: string;
      jwt: string;
    };
  }
}

const credentialsFile = path.join(import.meta.dirname, ".env.browserstack");

export default async function setup(
  project: TestProject,
): Promise<() => Promise<void>> {
  if (fs.existsSync(credentialsFile)) {
    process.loadEnvFile(credentialsFile);
  }
  const user = process.env.BROWSERSTACK_USERNAME;
  const key = process.env.BROWSERSTACK_ACCESS_KEY;
  if (!user || !key) {
    throw new Error(
      "BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY are not set, see browserstack/.env.browserstack.sample",
    );
  }

  await checkLocalServers();
  // Once for the whole run: the sessions run in parallel against one database
  const jwt = await seed();

  // Unique per run, so a tunnel left behind by an aborted run is not reused
  const localIdentifier = `konsti-${Date.now()}`;
  const tunnel = new browserstackLocal.Local();
  // On Windows the tunnel wrapper wraps its log path in literal quotes and
  // then fails to open that quoted name itself, so the path is set on the
  // instance as is
  Object.assign(tunnel, {
    logfile: path.join(os.tmpdir(), "konsti-browserstack-local.log"),
  });
  await new Promise<void>((resolve, reject) => {
    tunnel.start({ key, localIdentifier, forceLocal: true }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
  console.log("BrowserStack Local tunnel up");

  project.provide("browserstack", { user, key, localIdentifier, jwt });

  return async () => {
    await new Promise<void>((resolve) => {
      tunnel.stop(() => {
        resolve();
      });
    });
  };
}
