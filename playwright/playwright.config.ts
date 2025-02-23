import { PlaywrightTestConfig, Project, devices } from "@playwright/test";

const ENABLE_CHROME = true;
const ENABLE_FIREFOX = false;
const ENABLE_SAFARI = false;
const ENABLE_MOBILE_CHROME = false;
const ENABLE_MOBILE_SAFARI = false;

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
    name: "Mobile Safari",
    use: devices["iPhone 12"],
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_MOBILE_SAFARI &&
  projects.push({
    name: "Mobile Chrome",
    use: devices["Pixel 5"],
  });

const config: PlaywrightTestConfig = {
  projects,
  retries: process.env.CI ? 1 : 0,
  outputDir: "./test-results",
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASEURL ?? "http://localhost:8000",
    video: process.env.CI ? "on-first-retry" : "on",
    trace: process.env.CI ? "on-first-retry" : "on",
    headless: true,
    ignoreHTTPSErrors: true,
  },
};

// eslint-disable-next-line import/no-unused-modules
export default config;
