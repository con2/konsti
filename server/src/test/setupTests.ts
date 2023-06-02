import { vi } from "vitest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { logger } from "server/utils/logger";

dayjs.extend(utc);

const throwOnErrorLog = false;

// Don't show info, debug or warn logging in tests

logger.info = vi.fn().mockImplementation(() => {});
logger.debug = vi.fn().mockImplementation(() => {});
logger.warn = vi.fn().mockImplementation(() => {});

// Throw if errors are logged
// Useful at times, but prevents checking if error is handled correctly
logger.error = throwOnErrorLog
  ? vi.fn().mockImplementation((message: string) => {
      // eslint-disable-next-line no-restricted-syntax -- Test utility
      throw new Error(message);
    })
  : vi.fn().mockImplementation(() => {});

process.env.MONGOMS_VERSION = "6.0.6";
