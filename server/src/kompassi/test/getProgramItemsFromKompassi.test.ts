import { expect, test, vi } from "vitest";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";
import { ConventionName } from "shared/config/eventConfigTypes";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import {
  mockKompassiProgramItem,
  mockKompassiProgramItem2,
} from "server/kompassi/test/mockKompassiProgramItem";
import { getProgramItemsForConvention } from "server/features/program-item/programItemService";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";

const getMockKompassiProgramItems = (
  conventionName: ConventionName,
): KompassiProgramItem[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    case ConventionName.HITPOINT:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    case ConventionName.SOLMUKOHTA:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    case ConventionName.TRACON:
      return [mockKompassiProgramItem, mockKompassiProgramItem2];
    default:
      return exhaustiveSwitchGuard(conventionName);
  }
};

Object.values(ConventionName).map((conventionName) => {
  const mockKompassiProgramItems = getMockKompassiProgramItems(conventionName);

  test(`should parse convention ${conventionName} program items`, async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      conventionName,
    });

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: mockKompassiProgramItems,
    });

    const programItems = unsafelyUnwrap(await getProgramItemsForConvention());
    expect(programItems.length).toEqual(2);
  });
});
