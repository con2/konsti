import { GameDirectSignups } from "client/types/reduxTypes";
import { UserSignup } from "shared/types/models/programItem";

export const getUsersForGameId = (
  gameId: string,
  directSignups: readonly GameDirectSignups[],
): UserSignup[] => {
  const foundSignup = directSignups.find((signup) => signup.gameId === gameId);
  return foundSignup?.users ?? [];
};
