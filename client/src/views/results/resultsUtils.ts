import { UsersForGame } from "client/types/reduxTypes";
import { UserSignup } from "shared/types/models/game";

export const getUsersForGameId = (
  gameId: string,
  signups: readonly UsersForGame[],
): UserSignup[] => {
  const foundSignup = signups.find((signup) => signup.gameId === gameId);
  return foundSignup?.users ?? [];
};
