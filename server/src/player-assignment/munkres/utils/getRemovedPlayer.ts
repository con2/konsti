import { PlayerIdWithPriority } from 'typings/user.typings';

export const getRemovedPlayer = (
  playersWithTooHighPriority: readonly PlayerIdWithPriority[]
): PlayerIdWithPriority => {
  const randomIndex = Math.floor(
    Math.random() * playersWithTooHighPriority.length
  );
  const removedPlayer = playersWithTooHighPriority[randomIndex];

  return removedPlayer;
};
