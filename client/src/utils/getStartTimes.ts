import { Game } from 'shared/typings/game';

export const getStartTimes = (games: readonly Game[]): readonly string[] => {
  const startTimes = games.map((game) => {
    return game.startTime;
  });

  const uniqueTimes = [...Array.from(new Set(startTimes))];
  const sortedTimes = uniqueTimes.sort();

  return sortedTimes;
};
