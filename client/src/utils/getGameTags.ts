import { Game } from 'shared/typings/models/game';

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

  if (game.tags.includes('teema-elementit')) {
    tagsList.push(`themeElements`);
  }

  if (game.tags.includes('sopii-alle-7v-')) {
    tagsList.push(`suitableUnder7`);
  }

  if (game.tags.includes('sopii-7-12v-')) {
    tagsList.push(`suitable7to12`);
  }

  if (game.tags.includes('sopii-yli-12v-')) {
    tagsList.push(`suitableOver12`);
  }

  if (game.tags.includes('ei-sovellu-alle-15v-')) {
    tagsList.push(`notSuitableUnder15`);
  }

  if (game.tags.includes('lastenohjelma')) {
    tagsList.push(`childrensProgram`);
  }

  if (game.intendedForExperiencedParticipants) {
    tagsList.push(`intendedForExperiencedParticipants`);
  }

  return tagsList;
};
