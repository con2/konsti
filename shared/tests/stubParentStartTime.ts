import { vi } from "vitest";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";

// Puts the program item into a batch lotteried at the given time rather than at its own start
export const stubParentStartTime = (
  programItem: ProgramItem,
  parentStartTime: string,
): void => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([[programItem.parentId, parentStartTime]]),
  });
};
