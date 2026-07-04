import * as v8 from "node:v8";
import { Request, Response } from "express";

// Flushes the V8 code coverage collected so far to the directory given in
// NODE_V8_COVERAGE. The E2E coverage flow (scripts/runE2eCoverage.ts) calls
// this after the Playwright suite so the server's coverage reaches disk before
// the process is killed (a hard kill would otherwise discard it). Without
// NODE_V8_COVERAGE set, v8.takeCoverage() is a no-op
export const postWriteCoverage = (_req: Request, res: Response): Response => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Test-only endpoint
    throw new Error("Writing coverage not allowed in production");
  }

  v8.takeCoverage();
  return res.sendStatus(200);
};
