import { vi } from "vitest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { logger } from "server/utils/logger";
import { initializeDayjs } from "shared/utils/time";

dayjs.extend(utc);

initializeDayjs();

// Don't show info, debug or warn logging in tests

logger.info = vi.fn().mockImplementation(() => {});
logger.debug = vi.fn().mockImplementation(() => {});
logger.warn = vi.fn().mockImplementation(() => {});
logger.error = vi.fn().mockImplementation(() => {});

process.env.MONGOMS_VERSION = "6.0.6";
