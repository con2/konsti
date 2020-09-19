import { Game } from 'typings/game.typings';

export const getGameTags = (game: Game): string[] => {
  if (!game.tags) return [];

  const tagsList: string[] = [];

  if (game.tags.includes('in-english')) {
    tagsList.push(`inEnglish`);
  }

  if (game.tags.includes('sopii-lapsille')) {
    tagsList.push(`childrenFriendly`);
  }

  if (game.tags.includes('vain-taysi-ikaisille')) {
    tagsList.push(`ageRestricted`);
  }

  if (game.tags.includes('aloittelijaystavallinen')) {
    tagsList.push(`beginnerFriendly`);
  }

  if (game.tags.includes('kunniavieras')) {
    tagsList.push(`guestOfHonor`);
  }

  if (game.tags.includes('perheohjelma')) {
    tagsList.push(`family`);
  }

  if (game.intendedForExperiencedParticipants) {
    tagsList.push(`intendedForExperiencedParticipants`);
  }

  return tagsList;
};
