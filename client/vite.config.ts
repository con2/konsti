import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import mdx from "@mdx-js/rollup";
import browserslistToEsbuild from "browserslist-to-esbuild";
import { compression } from "vite-plugin-compression2";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  return {
    root: __dirname,

    build: {
      outDir: "build",
      sourcemap: true,
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
      react(),
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
    ],

    resolve: {
      tsconfigPaths: true,
      alias: {
        assets: path.resolve(__dirname, "assets"),
      },
    },

    // Replace process.env.* references at build time (used in shared/config/clientConfig.ts and client code)
    define: {
      "process.env.SETTINGS": JSON.stringify(env.SETTINGS),
      "process.env.API_SERVER_URL": JSON.stringify(env.API_SERVER_URL),
      "process.env.SHOW_TEST_VALUES": JSON.stringify(env.SHOW_TEST_VALUES),
      "process.env.DATA_UPDATE_INTERVAL": JSON.stringify(
        env.DATA_UPDATE_INTERVAL,
      ),
    },

    server: {
      host: "127.0.0.1",
      port: 8000,
      fs: {
        allow: [path.resolve(__dirname, "..")],
      },
    },
  };
});
