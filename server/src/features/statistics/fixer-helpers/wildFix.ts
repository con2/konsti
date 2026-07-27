import { readJson, writeJson } from "server/features/statistics/statsUtil";
import { logger } from "server/utils/logger";

export const wildFix = async (
  event: string,
  year: number,
  type: string,
): Promise<void> => {
  let data;
  try {
    data = readJson(event, year, type);
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

  await writeJson(event, year, type, data);
};
