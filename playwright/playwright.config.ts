import { PlaywrightTestConfig, Project, devices } from "@playwright/test";
import { resolvePortOffset } from "scripts/portOffset";

const ENABLE_CHROME = true;
const ENABLE_FIREFOX = false;
const ENABLE_SAFARI = false;
const ENABLE_MOBILE_CHROME = true;
const ENABLE_MOBILE_SAFARI = true;

const projects: Project[] = [];

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_CHROME &&
  projects.push({
    name: "Chrome Stable",
    use: {
      browserName: "chromium",
      // channel: "chrome", // Test against Chrome Stable channel.
    },
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_FIREFOX &&
  projects.push({
    name: "Desktop Firefox",
    use: {
      browserName: "firefox",
      viewport: { width: 800, height: 600 },
    },
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_SAFARI &&
  projects.push({
    name: "Desktop Safari",
    use: {
      browserName: "webkit",
      viewport: { width: 1200, height: 750 },
    },
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_MOBILE_CHROME &&
  projects.push({
    name: "Mobile Chrome",
    use: devices["Pixel 7"],
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_MOBILE_SAFARI &&
  projects.push({
    // iPhone SE (3rd gen) is the smallest supported viewport (375x667), so
    // this project covers both WebKit and the small-screen floor
    name: "Mobile Safari",
    use: devices["iPhone SE (3rd gen)"],
  });

// The per-worktree port offset shifts the client dev server port so the suite
// targets its own worktree's local instance. PLAYWRIGHT_BASEURL still wins
// when set (e.g. the Docker run points it at http://server:5000)
const portOffset = resolvePortOffset();

const config: PlaywrightTestConfig = {
  projects,
  retries: process.env.CI ? 1 : 0,
  outputDir: "./test-results",
  // In CI emit a blob report (one per shard) alongside the console list, so the shards can be
  // merged into a single HTML report. The blob dir is volume-mounted out of the Docker container
  reporter: process.env.CI ? [["list"], ["blob"]] : [["list"]],
  workers: 1,
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASEURL ?? `http://localhost:${8000 + portOffset}`,
    video: process.env.CI ? "on-first-retry" : "on",
    trace: process.env.CI ? "on-first-retry" : "on",
    headless: true,
    ignoreHTTPSErrors: true,
  },
};

export default config;
