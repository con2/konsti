import { PlaywrightTestConfig, Project, devices } from "@playwright/test";
import { TIMEZONE } from "shared/utils/timezone";
import { resolvePortOffset } from "scripts/portOffset";

// The browser timezone set below does not reach this process, and the specs
// build program item start times here, truncated to a wall-clock hour. In a zone
// offset by half an hour that boundary lands on :30 in the event's zone, which
// marks every lottery item invalid and hides its sign-up controls.
process.env.TZ = TIMEZONE;

// CI installs a fixed set of browsers, so a project enabled here also needs its
// own entries in the e2e job's matrix and its browser in the coverage workflow
const ENABLE_CHROME_DESKTOP = true;
const ENABLE_FIREFOX_DESKTOP = false;
const ENABLE_SAFARI_DESKTOP = false;
const ENABLE_CHROME_MOBILE = true;
const ENABLE_SAFARI_MOBILE = true;

const projects: Project[] = [];

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_CHROME_DESKTOP &&
  projects.push({
    name: "Chrome Desktop",
    use: {
      browserName: "chromium",
      // Needs Google Chrome, which `playwright install chromium` does not install
      // channel: "chrome",
    },
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_FIREFOX_DESKTOP &&
  projects.push({
    name: "Firefox Desktop",
    use: {
      browserName: "firefox",
    },
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_SAFARI_DESKTOP &&
  projects.push({
    name: "Safari Desktop",
    use: {
      browserName: "webkit",
    },
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_CHROME_MOBILE &&
  projects.push({
    name: "Chrome Mobile",
    use: devices["Pixel 7"],
  });

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unused-expressions
ENABLE_SAFARI_MOBILE &&
  projects.push({
    // iPhone SE (3rd gen) is the smallest supported viewport (375x667), so
    // this project covers both WebKit and the small-screen floor
    name: "Safari Mobile",
    use: devices["iPhone SE (3rd gen)"],
  });

// The per-worktree port offset shifts the client dev server port so the suite
// targets its own worktree's local instance. PLAYWRIGHT_BASEURL still wins
// when set (the E2E runner points it at the server, which serves the built
// client itself).
const portOffset = resolvePortOffset();

const config: PlaywrightTestConfig = {
  projects,
  retries: process.env.CI ? 1 : 0,
  outputDir: "./test-results",
  // In CI emit a blob report (one per shard) alongside the console list, so the shards can be
  // merged into a single HTML report
  reporter: process.env.CI ? [["list"], ["blob"]] : [["list"]],
  workers: 1,
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASEURL ?? `http://localhost:${8000 + portOffset}`,
    // Full HD for the desktop projects, rather than Playwright's 1280x720
    // default. The mobile projects carry their own device viewport, which
    // takes precedence over this one.
    viewport: { width: 1920, height: 1080 },
    video: process.env.CI ? "on-first-retry" : "on",
    trace: process.env.CI ? "on-first-retry" : "on",
    headless: true,
    ignoreHTTPSErrors: true,
    // Without this the browser inherits the host's zone: UTC in CI, whatever the
    // developer is in locally. The specs build fixture times from the wall clock
    // and assert times the app renders in the event's zone, so the two only
    // agree when they are the same zone. Pinned to the event's own, which is
    // also what an attendee at the event sees.
    timezoneId: TIMEZONE,
  },
};

export default config;
