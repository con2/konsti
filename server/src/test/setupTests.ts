import mongoose from "mongoose";
import { logger } from "server/utils/logger";

mongoose.set("strictQuery", false);

const throwOnErrorLog = false;

// Don't show info, debug or warn logging in tests
logger.info = jest.fn();
logger.debug = jest.fn();
logger.warn = jest.fn();

// Throw if errors are logged
// Useful at times, but prevents checking if error is handled correctly
logger.error = throwOnErrorLog
  ? jest.fn().mockImplementation((message: string) => {
      throw new Error(message);
    })
  : jest.fn();
