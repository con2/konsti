import 'array-flat-polyfill';
import { logger } from 'utils/logger';

// Don't show info or debug logging in tests
logger.info = jest.fn();
logger.debug = jest.fn();
