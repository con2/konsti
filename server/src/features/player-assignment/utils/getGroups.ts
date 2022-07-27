import dayjs from "dayjs";
import _ from "lodash";
import { Group } from "server/typings/padgRandomAssign.typings";
import { User } from "shared/typings/models/user";

export const getGroups = (
  playerGroups: readonly User[][],
  startingTime: string
): Group[] => {
  return playerGroups.map((playerGroup) => {
    const firstMember = _.first(playerGroup);
    if (!firstMember) {
      throw new Error("Padg assign: error getting first member");
    }

    const signedGamesForStartTime = firstMember.signedGames.filter(
      (signedGame) =>
        dayjs(signedGame.time).format() === dayjs(startingTime).format()
    );

    const sortedSignedGames = _.sortBy(
      signedGamesForStartTime,
      (signedGame) => signedGame.priority
    );

    return {
      id:
        firstMember.groupCode !== "0"
          ? firstMember.groupCode
          : firstMember.serial,
      size: playerGroup.length,
      pref: sortedSignedGames.map(
        (signedGame) => signedGame.gameDetails.gameId
      ),
    };
  });
};
