import _ from "lodash";
import dayjs from "dayjs";
import { ListItem } from "server/typings/padgRandomAssign.typings";
import { getAssignmentBonus } from "server/features/player-assignment/utils/getAssignmentBonus";
import { SelectedGame, User } from "shared/typings/models/user";
import { Signup } from "server/features/signup/signup.typings";

export const getList = (
  playerGroups: readonly User[][],
  startingTime: string,
  signups: readonly Signup[]
): ListItem[] => {
  return playerGroups.flatMap((playerGroup) => {
    const firstMember = _.first(playerGroup);
    if (!firstMember)
      throw new Error("Padg or Random assign: error getting first member");

    return firstMember.signedGames
      .filter(
        (signedGame) =>
          dayjs(signedGame.time).format() === dayjs(startingTime).format()
      )
      .map((signedGame) => {
        return {
          id:
            firstMember.groupCode !== "0"
              ? firstMember.groupCode
              : firstMember.serial,
          size: playerGroup.length,
          event: signedGame.gameDetails.gameId,
          gain: getGain(signedGame, playerGroup, signups),
        };
      });
  });
};

const getGain = (
  signedGame: SelectedGame,
  playerGroup: User[],
  signups: readonly Signup[]
): number => {
  const bonus = getAssignmentBonus(playerGroup, signups);

  switch (signedGame.priority) {
    case 1:
      return 1 + bonus;
    case 2:
      return 0.5 + bonus;
    case 3:
      return 0.33 + bonus;
  }

  throw new Error(`Invalid signup priority: ${signedGame.priority}`);
};
