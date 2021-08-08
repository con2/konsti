import { logger } from "server/utils/logger";

const throwOnErrorLog = false;

// Don't show info or debug logging in tests
logger.info = jest.fn();
logger.debug = jest.fn();

// Throw if errors are logged
// Useful at times, but prevents checking if error is handled correctly
logger.error = throwOnErrorLog
  ? jest.fn().mockImplementation((message) => {
      throw new Error(message);
    })
  : jest.fn();
