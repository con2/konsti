import { vi } from "vitest";
import { config } from "shared/config";
import { EventConfig } from "shared/config/eventConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";

// Puts the program item into a batch lotteried at the given time rather than at its own start,
// keeping the batches mocked before it, alongside any other event config the test needs. A
// file without a mock reset carries earlier overrides forward.
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
    // The spy's own value when one is already installed, so mocks build on each other
    ...config.event(),
    ...eventConfig,
    startTimesByParentIds: new Map([
      ...config.event().startTimesByParentIds,
      [programItem.parentId, parentStartTime],
    ]),
  });
};
