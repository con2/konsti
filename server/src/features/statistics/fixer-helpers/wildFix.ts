import { readJson, writeJson } from "server/features/statistics/statsUtil";
import { logger } from "server/utils/logger";

export const wildFix = async (
  year: number,
  event: string,
  type: string,
): Promise<void> => {
  let data;
  try {
    data = readJson(year, event, type);
  } catch (error) {
    logger.error("%s", error);
    return;
  }

  // Implement fixer logic here
  /*
  data.forEach((dataEntry) => {
    dataEntry.username = dataEntry.username.toUpperCase();
  });
  */

  await writeJson(year, event, type, data);
};
