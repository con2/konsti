import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { pipeline } from "node:stream";
import { apiPort, frontPort } from "./utils/ports.ts";

// Serves the built client with an SPA fallback and proxies the API to the
// test server, so the phone talks to one origin. The server cannot serve the
// build itself from a checkout whose path has a dot-directory in it (such as
// a worktree under .claude/): its SPA fallback refuses such a path outright.
const buildDir = path.join(import.meta.dirname, "../client/build");
const apiHost = "127.0.0.1";

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

const proxyToApi = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
): void => {
  // Browsers send Origin on every POST, and the server's CORS allowlist
  // does not know this origin; without the header it is a same-origin call
  const headers = { ...req.headers };
  delete headers.origin;
  delete headers.referer;
  const upstreamRequest = http.request(
    {
      host: apiHost,
      port: apiPort,
      method: req.method,
      path: req.url,
      headers: { ...headers, host: `${apiHost}:${apiPort}` },
    },
    (upstream) => {
      res.writeHead(upstream.statusCode ?? 502, upstream.headers);
      // Ends the response however the upstream one ends, also when the test
      // server's file watcher restarts it partway through
      pipeline(upstream, res, () => {
        // An error has already destroyed the response; nothing is left to do
      });
    },
  );
  upstreamRequest.on("error", () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.writeHead(502);
    res.end();
  });
  req.pipe(upstreamRequest);
};

const serveFile = (pathname: string, res: http.ServerResponse): void => {
  let filePath = path.join(buildDir, pathname);
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    // Only routes fall back to the app; a missing asset is a 404, or a page
    // left open across a rebuild would get HTML for a chunk and reload
    if (path.extname(pathname) !== "") {
      res.writeHead(404);
      res.end();
      return;
    }
    filePath = path.join(buildDir, "index.html");
  }
  res.writeHead(200, {
    "Content-Type":
      contentTypes[path.extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  // A rebuild replacing the file mid-read must cut this response, not crash
  // the server for every request after it
  createReadStream(filePath)
    .on("error", () => {
      res.destroy();
    })
    .pipe(res);
};

if (!existsSync(path.join(buildDir, "index.html"))) {
  throw new Error(
    `No client build at ${buildDir}, run yarn browserstack:build`,
  );
}

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
      proxyToApi(req, res);
      return;
    }
    serveFile(pathname, res);
  })
  .listen(frontPort, "127.0.0.1", () => {
    console.log(
      `Serving ${buildDir} on http://127.0.0.1:${frontPort}, API proxied to :${apiPort}`,
    );
  });
