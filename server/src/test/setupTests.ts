import 'array-flat-polyfill';
import { logger } from 'server/utils/logger';

// Don't show info or debug logging in tests
logger.info = jest.fn();
logger.debug = jest.fn();
