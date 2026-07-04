import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import mdx from "@mdx-js/rollup";
import browserslistToEsbuild from "browserslist-to-esbuild";
import { compression } from "vite-plugin-compression2";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import istanbul from "vite-plugin-istanbul";
import { coverageCollector } from "./coverageCollectorPlugin";
import { sentryConfig } from "../shared/config/sentryConfig";
import { resolvePortOffset } from "../scripts/portOffset";
import {
  clientCoverageExclude,
  clientCoverageInclude,
} from "../scripts/coverageGlobs";

const SENTRY_PROJECT_BY_MODE: Record<string, string> = {
  production: "konsti-frontend-prod",
  staging: "konsti-frontend-staging",
  development: "konsti-frontend-dev",
};

// Auth token for Sentry source map upload. CI / shell env wins (set as a build
// secret in the Docker build); otherwise fall back to the gitignored
// client/.env.sentry-build-plugin file so local builds can upload too
const readSentryAuthToken = (dir: string): string | undefined => {
  if (process.env.SENTRY_AUTH_TOKEN) {
    return process.env.SENTRY_AUTH_TOKEN;
  }
  const file = path.join(dir, ".env.sentry-build-plugin");
  if (!existsSync(file)) {
    return undefined;
  }
  const match = readFileSync(file, "utf8").match(
    /^\s*SENTRY_AUTH_TOKEN\s*=\s*(.*)$/m,
  );
  return match?.[1]?.trim().replace(/^["']|["']$/g, "") || undefined;
};

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, import.meta.dirname, "");

  // PORT_OFFSET lets several local instances (e.g. one per git worktree) run side
  // by side: it shifts the dev server port and the API server it talks to by the
  // same amount as the backend's PORT_OFFSET. For the dev server the offset is
  // resolved automatically per git worktree (an explicit PORT_OFFSET still
  // wins); builds only use an explicit value so a build made in a worktree
  // doesn't bake a shifted API URL into the bundle. When the offset is set,
  // the offset API URL wins over API_SERVER_URL so a committed
  // .env.development value doesn't pin every instance to port 5000
  const portOffset =
    command === "serve"
      ? resolvePortOffset(env.PORT_OFFSET)
      : Number(env.PORT_OFFSET) || 0;
  const apiServerUrl =
    portOffset > 0
      ? `http://127.0.0.1:${5000 + portOffset}`
      : env.API_SERVER_URL;

  // Upload source maps to Sentry only when an auth token is available (CI build
  // secret, or the local client/.env.sentry-build-plugin file). The development
  // build only uploads when enableSentryInDev is set.
  const sentryAuthToken = readSentryAuthToken(import.meta.dirname);
  const sentryProject = SENTRY_PROJECT_BY_MODE[mode];
  const enableSentryUpload =
    Boolean(sentryAuthToken) &&
    Boolean(sentryProject) &&
    (mode !== "development" || sentryConfig.enableSentryInDev);

  return {
    root: import.meta.dirname,

    build: {
      outDir: "build",
      // "hidden" still emits .map files (uploaded to Sentry with debug IDs by
      // the plugin below) but omits the //# sourceMappingURL comment, so the
      // shipped bundle never advertises a map URL for browsers or Sentry to fetch
      sourcemap: "hidden",
      // Vite 8 uses Oxc which uses same target format as esbuild
      target: browserslistToEsbuild(),
    },

    plugins: [
      mdx(),
      svgr({
        include: "**/*.svg",
        svgrOptions: {
          svgProps: { role: "img" },
        },
      }),
      react({
        babel: {
          // The react-compiler transform rewrites code so heavily that istanbul
          // coverage positions no longer match the original source, so it is
          // dropped when serving the instrumented build for the E2E coverage
          // flow (COVERAGE=true, see the istanbul plugin below)
          plugins:
            env.COVERAGE === "true"
              ? []
              : [["babel-plugin-react-compiler", { target: "19" }]],
        },
      }),
      viteStaticCopy({
        targets: [
          {
            src: "assets/robots.txt",
            dest: ".",
          },
        ],
      }),
      compression({
        algorithms: ["gzip", "brotliCompress"],
        include: /\.(js|html|svg)$/,
        threshold: 10240,
      }),
      // Istanbul-instrument the dev-served code when the E2E coverage flow
      // (`yarn coverage`, see scripts/runE2eCoverage.ts) starts the dev server
      // with COVERAGE=true. cwd is the repo root so the single-source globs
      // (scripts/coverageGlobs.ts) apply as-is and shared/ modules served to
      // the browser are instrumented too. The collector plugin harvests the
      // browser's window.__coverage__ back into coverage/e2e/client/ so the
      // Playwright suite needs no coverage hooks
      env.COVERAGE === "true" &&
        istanbul({
          cwd: path.resolve(import.meta.dirname, ".."),
          include: clientCoverageInclude,
          exclude: clientCoverageExclude,
          extension: [".ts", ".tsx"],
        }),
      env.COVERAGE === "true" && coverageCollector(),
      // Must come after all other plugins. Injects debug IDs into the emitted
      // bundle, uploads the source maps to Sentry, then deletes the .map files
      // so they are never shipped
      enableSentryUpload &&
        sentryVitePlugin({
          org: "konsti",
          project: sentryProject,
          authToken: sentryAuthToken,
          release: { name: process.env.SENTRY_RELEASE },
          telemetry: false,
          sourcemaps: {
            filesToDeleteAfterUpload: ["./build/**/*.map"],
          },
        }),
    ],

    resolve: {
      tsconfigPaths: true,
      alias: {
        assets: path.resolve(import.meta.dirname, "assets"),
      },
    },

    // Replace process.env.* references at build time (used in shared/config/clientConfig.ts and client code)
    define: {
      "process.env.SETTINGS": JSON.stringify(env.SETTINGS),
      "process.env.API_SERVER_URL": JSON.stringify(apiServerUrl),
      "process.env.SHOW_TEST_VALUES": JSON.stringify(env.SHOW_TEST_VALUES),
      "process.env.DATA_UPDATE_INTERVAL": JSON.stringify(
        env.DATA_UPDATE_INTERVAL,
      ),
    },

    server: {
      host: "127.0.0.1",
      port: 8000 + portOffset,
      // Fail instead of silently drifting to the next free port: a drifted
      // instance no longer matches its server's CORS origin or the port the
      // Playwright suite targets, which is much harder to debug
      strictPort: true,
      fs: {
        allow: [path.resolve(import.meta.dirname, "..")],
      },
    },
  };
});
