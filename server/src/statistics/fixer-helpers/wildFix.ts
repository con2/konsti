import { readJson, writeJson } from '../statsUtil';
import { logger } from 'utils/logger';

export const wildFix = (year: number, event: string, type: string): void => {
  let data;
  try {
    data = readJson(year, event, type);
  } catch (error) {
    logger.error(error);
    return;
  }

  // Implement fixer logic here
  /*
  data.forEach((dataEntry) => {
    dataEntry.username = dataEntry.username.toUpperCase();
  });
  */

  writeJson(year, event, type, data);
};
