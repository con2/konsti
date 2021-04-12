import 'array-flat-polyfill';
import { logger } from 'server/utils/logger';

// Don't show info or debug logging in tests
logger.info = jest.fn();
logger.debug = jest.fn();

// Throw if errors are logged
/*
logger.error = jest.fn().mockImplementation((message) => {
  throw new Error(message);
});
*/
