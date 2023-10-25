import { vi } from "vitest";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { getServerConfig } from "shared/config/serverConfig";

initializeDayjs();

if (!getServerConfig().enableLoggingInTests) {
  // Don't show logging in tests
  vi.doMock("server/utils/logger", () => {
    return {
      logger: {
        info: vi.fn().mockImplementation(() => {}),
        debug: vi.fn().mockImplementation(() => {}),
        warn: vi.fn().mockImplementation(() => {}),
        error: vi.fn().mockImplementation(() => {}),
      },
    };
  });
}

process.env.MONGOMS_VERSION = "6.0.10";
