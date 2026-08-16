import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import mdx from "@mdx-js/rollup";
import babel from "@rolldown/plugin-babel";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import browserslistToEsbuild from "browserslist-to-esbuild";
import { defineConfig, loadEnv } from "vite";
import { compression } from "vite-plugin-compression2";
import istanbul from "vite-plugin-istanbul";
import svgr from "vite-plugin-svgr";
import {
  clientCoverageExclude,
  clientCoverageInclude,
} from "../scripts/coverageGlobs";
import { resolvePortOffset } from "../scripts/portOffset";
import { sentryConfig } from "../shared/config/sentryConfig";
import { coverageCollector } from "./coverageCollectorPlugin";
import { preloadBootChunks } from "./preloadBootChunksPlugin";

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

  // Build time of this image, from the APP_BUILD_TIME Docker build-arg. The
  // client reports an update only when the server's build is strictly newer,
  // so this is what tells a newer deploy from an instance yet to roll. Docker
  // sets the env var to an empty string when the build-arg is not provided, so
  // || rather than ?? treats that as unset too. Development and ci builds fall
  // back to 0, the earliest possible time, so any build the E2E suite fakes
  // counts as newer; the banner stays off otherwise because those servers
  // report no build time at all
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const appBuildTime =
    process.env.APP_BUILD_TIME ||
    (mode === "development" || mode === "ci" ? "0" : "");
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

      rolldownOptions: {
        output: {
          // Keep dependencies out of the app's own chunks so their content
          // hashes survive a deploy. Without this split every
          // app change also re-downloads React and everything else bundled
          // alongside it. React and Sentry get their own chunks because they
          // are the two largest and update on their own schedule
          codeSplitting: {
            groups: [
              {
                name: "react",
                // Separator-anchored so react-dom is matched but the unrelated
                // react-* packages fall through to the vendor group
                test: /node_modules[\\/](react-dom|react|scheduler)[\\/]/,
                priority: 2,
              },
              {
                name: "sentry",
                test: /node_modules[\\/]@sentry[\\/]/,
                priority: 2,
              },
              {
                name: "vendor",
                test: /node_modules[\\/]/,
                priority: 1,
              },
            ],
          },
        },
      },
    },

    plugins: [
      // Must track the dev server rather than the build mode: left to itself
      // the plugin turns development on whenever the mode is literally named
      // "development", so `build:dev` emitted jsxDEV calls into a bundle that
      // carries React's production jsx-dev-runtime, where jsxDEV is undefined,
      // and every Markdown page threw on render
      mdx({ development: command === "serve" }),
      svgr({
        include: "**/*.svg",
        svgrOptions: {
          svgProps: { role: "img" },
        },
      }),
      react(),
      // React Compiler is a separate babel pass: this plugin transforms JSX
      // with Oxc and takes no babel options of its own. The compiler rewrites
      // code so heavily that istanbul coverage positions no longer match the
      // original source, so it is dropped when serving the instrumented build
      // for the E2E coverage flow (COVERAGE=true, see the istanbul plugin
      // below)
      env.COVERAGE !== "true" &&
        babel({ presets: [reactCompilerPreset({ target: "19" })] }),
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
      // The root component is dynamically imported but always rendered, so its
      // chunks are preloaded rather than discovered after the entry has run
      preloadBootChunks(["client/src/app/App.tsx"]),
      // Must come after all other plugins. Injects debug IDs into the emitted
      // bundle, uploads the source maps to Sentry, then deletes the .map files
      // so they are never shipped
      enableSentryUpload &&
        sentryVitePlugin({
          org: "konsti",
          project: sentryProject,
          authToken: sentryAuthToken,
          // The raw build-arg rather than the appVersion placeholder, so
          // dev-mode uploads don't create a release named after the fallback
          release: { name: process.env.APP_VERSION || undefined },
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
      // The app compares this against the version the server reports to
      // detect that a new version has been deployed
      "process.env.APP_BUILD_TIME": JSON.stringify(appBuildTime),
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
