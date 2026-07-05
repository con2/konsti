import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

// Collects the istanbul coverage produced by vite-plugin-istanbul (see
// vite.config.ts) without any test-runner cooperation: a script injected into
// index.html periodically flushes window.__coverage__ back to the dev server,
// and a middleware files it under coverage/e2e/client/ for
// scripts/mergeCoverageReport.ts. This keeps the Playwright specs on plain
// @playwright/test imports - any browser session against the instrumented dev
// server feeds the combined report.
//
// Counters are cumulative per page load and each page load flushes under its
// own session id, so the last successful flush per page wins and nothing
// double-counts. When the page closes, a pagehide handler sends only the
// counter DELTA since the last successful full flush: keepalive requests
// reject bodies over ~64KB and the full coverage object is always larger, so
// a small delta is the only payload that can survive page dismissal. The
// middleware folds the delta into the already-written session file
//
// The periodic flush polls the counters on a short interval and only posts
// when they changed since the last successful flush. The interval must be
// short because Playwright force-closes pages without firing pagehide, so
// anything not flushed before the test ends is lost - with a slow blind
// interval, a short spec's final interaction (often the whole point of an
// error-path test) never reached the session file

const coverageDir = path.join(
  import.meta.dirname,
  "..",
  "coverage",
  "e2e",
  "client",
);

const flushScript = `
const sessionId = crypto.randomUUID();
let lastSent = null;

const counters = (coverage) => {
  const out = {};
  for (const file in coverage) {
    const entry = coverage[file];
    const buckets = {};
    for (const key in entry.b) {
      buckets[key] = entry.b[key].slice();
    }
    out[file] = { s: { ...entry.s }, f: { ...entry.f }, b: buckets };
  }
  return out;
};

const diffCounts = (current, previous, changed) => {
  const out = {};
  for (const key in current) {
    const diff = current[key] - (previous ? (previous[key] ?? 0) : 0);
    if (diff > 0) {
      out[key] = diff;
      changed.value = true;
    }
  }
  return out;
};

const computeDelta = (current, previous) => {
  const delta = {};
  for (const file in current) {
    const prev = previous ? previous[file] : undefined;
    const cur = current[file];
    const changed = { value: false };
    const entry = {
      s: diffCounts(cur.s, prev ? prev.s : undefined, changed),
      f: diffCounts(cur.f, prev ? prev.f : undefined, changed),
      b: {},
    };
    for (const key in cur.b) {
      const prevBuckets = prev ? prev.b[key] : undefined;
      const diff = cur.b[key].map(
        (value, i) => value - (prevBuckets ? (prevBuckets[i] ?? 0) : 0),
      );
      if (diff.some((value) => value > 0)) {
        entry.b[key] = diff;
        changed.value = true;
      }
    }
    if (changed.value) {
      delta[file] = entry;
    }
  }
  return delta;
};

// Single in-flight request: a second POST racing the first could land out of
// order and overwrite newer counters with older ones
let inFlight = false;

const flushFull = () => {
  const coverage = window.__coverage__;
  if (!coverage || inFlight) {
    return;
  }
  inFlight = true;
  const snapshot = counters(coverage);
  void fetch("/__coverage__/" + sessionId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coverage),
  })
    .then((response) => {
      if (response.ok) {
        lastSent = snapshot;
      }
    })
    .catch(() => {})
    .finally(() => {
      inFlight = false;
    });
};

const flushIfChanged = () => {
  const coverage = window.__coverage__;
  if (!coverage || inFlight) {
    return;
  }
  const delta = computeDelta(counters(coverage), lastSent);
  if (Object.keys(delta).length === 0) {
    return;
  }
  flushFull();
};

const flushDelta = () => {
  const coverage = window.__coverage__;
  if (!coverage) {
    return;
  }
  const delta = computeDelta(counters(coverage), lastSent);
  if (Object.keys(delta).length === 0) {
    return;
  }
  // keepalive lets the request outlive the page; the delta payload is small
  // enough to fit the keepalive body cap once a full flush has landed
  void fetch("/__coverage__/" + sessionId + "/delta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delta),
    keepalive: true,
  }).catch(() => {});
};

// The load-event flush establishes the session file early so even a page
// that closes before the first interval tick keeps its boot coverage, and
// the pagehide delta then has a base to build on
window.addEventListener("load", flushFull);
setInterval(flushIfChanged, 150);
window.addEventListener("pagehide", flushDelta);
`;

interface SessionCounters {
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

const applyDelta = (
  session: Record<string, SessionCounters>,
  delta: Record<string, SessionCounters>,
): void => {
  for (const [file, deltaEntry] of Object.entries(delta)) {
    const entry = session[file] as SessionCounters | undefined;
    if (!entry) {
      continue;
    }
    for (const [key, count] of Object.entries(deltaEntry.s)) {
      entry.s[key] = (entry.s[key] ?? 0) + count;
    }
    for (const [key, count] of Object.entries(deltaEntry.f)) {
      entry.f[key] = (entry.f[key] ?? 0) + count;
    }
    for (const [key, counts] of Object.entries(deltaEntry.b)) {
      const buckets = entry.b[key] as number[] | undefined;
      if (buckets?.length !== counts.length) {
        continue;
      }
      for (const [index, count] of counts.entries()) {
        buckets[index] += count;
      }
    }
  }
};

export const coverageCollector = (): Plugin => ({
  name: "konsti:coverage-collector",

  transformIndexHtml: () => [
    {
      tag: "script",
      attrs: { type: "module" },
      children: flushScript,
      injectTo: "head",
    },
  ],

  configureServer: (server) => {
    fs.mkdirSync(coverageDir, { recursive: true });
    server.middlewares.use("/__coverage__", (req, res) => {
      // The mount prefix is stripped, leaving "/<sessionId>" or
      // "/<sessionId>/delta"
      const segments: (string | undefined)[] = (req.url ?? "").split("/");
      const [, sessionId, deltaSegment, rest] = segments;
      const isDelta = deltaSegment === "delta";
      const validPath =
        /^[\w-]{10,64}$/.test(sessionId ?? "") &&
        (deltaSegment === undefined || (isDelta && rest === undefined));
      if (req.method !== "POST" || !validPath) {
        res.statusCode = 400;
        res.end();
        return;
      }
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        const filePath = path.join(coverageDir, `coverage-${sessionId}.json`);
        try {
          if (isDelta) {
            // A delta without a preceding full flush cannot be reconstructed
            // (it has no coverage maps) - drop it
            if (fs.existsSync(filePath)) {
              const session = JSON.parse(
                fs.readFileSync(filePath, "utf8"),
              ) as Record<string, SessionCounters>;
              applyDelta(
                session,
                JSON.parse(Buffer.concat(chunks).toString()) as Record<
                  string,
                  SessionCounters
                >,
              );
              fs.writeFileSync(filePath, JSON.stringify(session));
            }
          } else {
            fs.writeFileSync(filePath, Buffer.concat(chunks));
          }
          res.statusCode = 204;
        } catch {
          res.statusCode = 400;
        }
        res.end();
      });
    });
  },
});
