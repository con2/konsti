import { vi } from "vitest";
import { config } from "shared/config";
import { EventConfig } from "shared/config/eventConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";

// Puts the program item into a batch lotteried at the given time rather than at its own start,
// alongside any other event config the test needs. The spy builds on what config.event()
// returns at the time, so a file without a mock reset carries earlier overrides forward.
export const mockParentStartTime = ({
  programItem,
  parentStartTime,
  eventConfig = {},
}: {
  programItem: ProgramItem;
  parentStartTime: string;
  eventConfig?: Omit<Partial<EventConfig>, "startTimesByParentIds">;
}): void => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    ...eventConfig,
    startTimesByParentIds: new Map([[programItem.parentId, parentStartTime]]),
  });
};
