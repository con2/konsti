import { ProgramItem } from "shared/types/models/programItem";

export const getStartTimes = (
  programItems: readonly ProgramItem[],
): readonly string[] => {
  const startTimes = programItems.map((game) => {
    return game.startTime;
  });

  const uniqueTimes = [...Array.from(new Set(startTimes))];
  const sortedTimes = uniqueTimes.sort();

  return sortedTimes;
};
