import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";
import { KompassiError } from "shared/types/api/errors";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { getProgramItemsForEvent } from "server/features/program-item/programItemService";
import {
  getProgramFromServer,
  testHelperWrapper,
} from "server/kompassi/getProgramItemsFromKompassi";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  mockKompassiProgramItem,
  mockKompassiProgramItem2,
} from "server/kompassi/test/mockKompassiProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe("loading the program from the Kompassi server", () => {
  test("should report the HTTP status when Kompassi answers with an error page", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Bad Gateway", { status: 502, statusText: "Bad Gateway" }),
    );

    const result = await getProgramFromServer();

    expect(result).toEqual({
      ok: false,
      error: KompassiError.UNKNOWN_ERROR,
    });
    expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        "Error downloading program items from Kompassi: responded 502 Bad Gateway",
      ),
    );
  });
});
