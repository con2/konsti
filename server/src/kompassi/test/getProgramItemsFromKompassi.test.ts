import { expect, test, vi } from "vitest";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import {
  mockKompassiProgramItemRopecon,
  mockKompassiProgramItemRopecon2,
} from "server/kompassi/test/mockKompassiProgramItemRopecon";
import { getProgramItemsForConvention } from "server/features/program-item/programItemService";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  mockKompassiProgramItemHitpoint,
  mockKompassiProgramItemHitpoint2,
} from "server/kompassi/test/mockKompassiProgramItemHitpoint";
import {
  mockKompassiProgramItemSolmukohta,
  mockKompassiProgramItemSolmukohta2,
} from "server/kompassi/test/mockKompassiProgramItemSolmukohta";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";

const getMockKompassiProgramItems = (
  conventionName: ConventionName,
): KompassiProgramItem[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return [mockKompassiProgramItemRopecon, mockKompassiProgramItemRopecon2];
    case ConventionName.HITPOINT:
      return [
        mockKompassiProgramItemHitpoint,
        mockKompassiProgramItemHitpoint2,
      ];
    case ConventionName.SOLMUKOHTA:
      return [
        mockKompassiProgramItemSolmukohta,
        mockKompassiProgramItemSolmukohta2,
      ];
    default:
      return exhaustiveSwitchGuard(conventionName);
  }
};

Object.values(ConventionName).map((conventionName) => {
  const mockKompassiProgramItems = getMockKompassiProgramItems(conventionName);

  test(`should parse convention ${conventionName} program items`, async () => {
    vi.spyOn(config, "shared").mockReturnValue({
      ...config.shared(),
      conventionName,
    });

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: mockKompassiProgramItems,
    });

    const programItems = unsafelyUnwrap(await getProgramItemsForConvention());
    expect(programItems.length).toEqual(2);
  });
});
