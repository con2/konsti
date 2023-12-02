import { groupBy } from "lodash-es";
import { User } from "shared/types/models/user";

export const getPlayerGroups = (
  players: readonly User[],
): readonly User[][] => {
  const groupedUsers = groupBy(players, "groupCode");

  const playersArray = [] as User[][];
  for (const [key, value] of Object.entries(groupedUsers)) {
    if (Array.isArray(value)) {
      if (key === "0") {
        // Loop array and add players individually
        for (let i = 0; i < value.length; i++) {
          playersArray.push([value[i]]);
        }
      } else {
        playersArray.push(value);
      }
    }
  }

  return playersArray;
};
