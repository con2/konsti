import dayjs from "dayjs";
import { config } from "shared/config";

export const isStartTimeChanged = (
  signedToStartTime: string,
  programItemStartTime: string,
  parentId: string,
): boolean => {
  const { startTimesByParentIds } = config.event();

  const startTimeChanged = !dayjs(signedToStartTime).isSame(
    dayjs(programItemStartTime, "minute"),
  );

  const parentIdMatch = startTimesByParentIds.has(parentId);

  const parentStartTimeChanged = !dayjs(signedToStartTime).isSame(
    dayjs(startTimesByParentIds.get(parentId)),
    "minute",
  );

  return parentIdMatch ? parentStartTimeChanged : startTimeChanged;
};
