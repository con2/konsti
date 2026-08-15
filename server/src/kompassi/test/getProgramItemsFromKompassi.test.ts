import { describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { getProgramItemsForEvent } from "server/features/program-item/programItemService";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  mockKompassiProgramItem,
  mockKompassiProgramItem2,
} from "server/kompassi/test/mockKompassiProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

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
  for (const eventName of Object.values(EventName)) {
    const mockKompassiProgramItems = getMockKompassiProgramItems(eventName);

    test(`should parse event ${eventName} program items`, async () => {
      vi.spyOn(config, "event").mockReturnValue({
        ...config.event(),
        eventName,
      });

      vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
        ok: true,
        value: mockKompassiProgramItems,
      });

      const programItems = unsafelyUnwrap(await getProgramItemsForEvent());
      expect(programItems.length).toEqual(2);
    });
  }
});
