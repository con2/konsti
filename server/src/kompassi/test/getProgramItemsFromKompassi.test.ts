import { describe, expect, test, vi } from "vitest";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import {
  mockKompassiProgramItem,
  mockKompassiProgramItem2,
} from "server/kompassi/test/mockKompassiProgramItem";
import { getProgramItemsForEvent } from "server/features/program-item/programItemService";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";

const getMockKompassiProgramItems = (
  eventName: EventName,
): KompassiProgramItem[] => {
  switch (eventName) {
    case EventName.ROPECON:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    case EventName.HITPOINT:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    case EventName.SOLMUKOHTA:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    case EventName.TRACON:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    default:
      return exhaustiveSwitchGuard(eventName);
  }
};

describe("should load Kompassi data for all events", () => {
  // Loop all event names
  Object.values(EventName).map((eventName) => {
    const mockKompassiProgramItems = getMockKompassiProgramItems(eventName);

    test(`should parse event ${eventName} program items`, async () => {
      vi.spyOn(config, "event").mockReturnValue({
        ...config.event(),
        eventName,
      });

      vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
        value: mockKompassiProgramItems,
      });

      const programItems = unsafelyUnwrap(await getProgramItemsForEvent());
      expect(programItems.length).toEqual(2);
    });
  });
});
