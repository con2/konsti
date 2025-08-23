import dayjs from "dayjs";
import { config } from "shared/config";

export const isStartTimeMatch = (
  startTime: string,
  timeToMatch: string,
  parentId: string | undefined,
): boolean => {
  const { startTimesByParentIds } = config.event();

  const startTimeMatch = dayjs(startTime).isSame(dayjs(timeToMatch), "minute");

  if (!parentId) {
    return startTimeMatch;
  }

  const parentIdMatch = startTimesByParentIds.has(parentId);

  const parentStartTimeMatch = dayjs(
    startTimesByParentIds.get(parentId),
  ).isSame(timeToMatch, "minute");

  return parentIdMatch ? parentStartTimeMatch : startTimeMatch;
};
