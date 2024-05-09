import { expect, test, vi } from "vitest";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import {
  mockKompassiGameRopecon,
  mockKompassiGameRopecon2,
} from "server/kompassi/test/mockKompassiGameRopecon";
import { getGamesForConvention } from "server/features/program-item/programItemService";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  mockKompassiGameHitpoint,
  mockKompassiGameHitpoint2,
} from "server/kompassi/test/mockKompassiGameHitpoint";
import {
  mockKompassiGameSolmukohta,
  mockKompassiGameSolmukohta2,
} from "server/kompassi/test/mockKompassiGameSolmukohta";
import { kompassiProgramItem } from "server/kompassi/kompassiProgramItem";

const getMockKompassiGames = (
  conventionName: ConventionName,
): kompassiProgramItem[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return [mockKompassiGameRopecon, mockKompassiGameRopecon2];
    case ConventionName.HITPOINT:
      return [mockKompassiGameHitpoint, mockKompassiGameHitpoint2];
    case ConventionName.SOLMUKOHTA:
      return [mockKompassiGameSolmukohta, mockKompassiGameSolmukohta2];
    default:
      return exhaustiveSwitchGuard(conventionName);
  }
};

Object.values(ConventionName).map((conventionName) => {
  const mockKompassiGames = getMockKompassiGames(conventionName);

  test(`should parse convention ${conventionName} program items`, async () => {
    vi.spyOn(config, "shared").mockReturnValue({
      ...config.shared(),
      conventionName,
    });

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: mockKompassiGames,
    });

    const games = unsafelyUnwrapResult(await getGamesForConvention());
    expect(games.length).toEqual(2);
  });
});
