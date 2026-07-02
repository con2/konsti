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
import { sentryConfig } from "../shared/config/sentryConfig";

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");

  // PORT_OFFSET lets several local instances (e.g. one per git worktree) run side
  // by side: it shifts the dev server port and the API server it talks to by the
  // same amount as the backend's PORT_OFFSET. Default 0 keeps the classic ports.
  // When set, the offset API URL wins over API_SERVER_URL so a committed
  // .env.development value doesn't pin every instance to port 5000
  const portOffset = Number(env.PORT_OFFSET) || 0;
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
          plugins: [["babel-plugin-react-compiler", { target: "19" }]],
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
      fs: {
        allow: [path.resolve(import.meta.dirname, "..")],
      },
    },
  };
});
