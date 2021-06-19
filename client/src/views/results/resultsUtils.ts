import { UsersForGame } from 'client/typings/redux.typings';

export const getUsernamesForGameId = (
  gameId: string,
  signups: readonly UsersForGame[]
): string[] => {
  const foundSignup = signups.find((signup) => signup.gameId === gameId);
  return foundSignup?.usernames ?? [];
};
