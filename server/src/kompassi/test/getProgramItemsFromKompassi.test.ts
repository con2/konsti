import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { KompassiError } from "shared/types/api/errors";
import { ProgramType } from "shared/types/models/programItem";
import { getProgramItemsForEvent } from "server/features/program-item/programItemService";
import {
  getProgramFromServer,
  testHelperWrapper,
} from "server/kompassi/getProgramItemsFromKompassi";
import { KompassiKonstiProgramType } from "server/kompassi/kompassiProgramItem";
import {
  mockKompassiProgramItem,
  mockKompassiProgramItem2,
} from "server/kompassi/test/mockKompassiProgramItem";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

afterEach(() => {
  // The logger is a shared mock from the test setup, so its call history has to be cleared
  // as well as the fetch spy restored
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("picking Konsti program items from the full program", () => {
  test("should keep program items that carry a Konsti program type", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [mockKompassiProgramItem, mockKompassiProgramItem2],
    });

    const programItems = unsafelyUnwrap(await getProgramItemsForEvent());
    expect(programItems.length).toEqual(2);
  });

  test("should drop program items without a Konsti program type", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [
        mockKompassiProgramItem,
        {
          ...mockKompassiProgramItem2,
          cachedDimensions: {
            ...mockKompassiProgramItem2.cachedDimensions,
            konsti: [],
          },
        },
      ],
    });

    const programItems = unsafelyUnwrap(await getProgramItemsForEvent());
    expect(programItems.map((p) => p.programItemId)).toEqual([
      mockKompassiProgramItem.slug,
    ]);
  });

  test("should import a hand picked program item without a Konsti program type as 'other'", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      addToKonstiOther: [mockKompassiProgramItem2.slug],
    });
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [
        mockKompassiProgramItem,
        {
          ...mockKompassiProgramItem2,
          cachedDimensions: {
            ...mockKompassiProgramItem2.cachedDimensions,
            konsti: [],
          },
        },
      ],
    });

    const programItems = unsafelyUnwrap(await getProgramItemsForEvent());
    expect(programItems.map((p) => [p.programItemId, p.programType])).toEqual([
      [mockKompassiProgramItem.slug, ProgramType.TABLETOP_RPG],
      [mockKompassiProgramItem2.slug, ProgramType.OTHER],
    ]);
  });

  test("should override the Konsti program type of a hand picked program item with 'other'", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      addToKonstiOther: [mockKompassiProgramItem2.slug],
    });
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [
        {
          ...mockKompassiProgramItem2,
          cachedDimensions: {
            ...mockKompassiProgramItem2.cachedDimensions,
            konsti: [KompassiKonstiProgramType.LARP],
          },
        },
      ],
    });

    const programItems = unsafelyUnwrap(await getProgramItemsForEvent());
    expect(programItems.map((p) => p.programType)).toEqual([ProgramType.OTHER]);
  });
});

describe("loading the program from the Kompassi server", () => {
  test("should fail the download when Kompassi does not answer in time", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      ),
    );

    const result = await getProgramFromServer();

    expect(result).toEqual({
      ok: false,
      error: KompassiError.UNKNOWN_ERROR,
    });
    expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error("Error downloading program items from Kompassi", {
        cause: new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError",
        ),
      }),
    );
  });

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
