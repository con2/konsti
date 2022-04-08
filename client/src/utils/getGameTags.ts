import { Game } from "shared/typings/models/game";

enum Tag {
  IN_ENGLISH = "inEnglish",
  CHILDREN_FRIENDLY = "childrenFriendly",
  AGE_RESTRICTED = "ageRestricted",
  BEGINNER_FRIENDLY = "beginnerFriendly",
  FOR_EXPERIENCED_PARTICIPANTS = "intendedForExperiencedParticipants",
  GUEST_OF_HONOR = "guestOfHonor",
  FAMILY = "family",
  THEME_ELEMENTS = "themeElements",
  SUITABLE_UNDER_7 = "suitableUnder7",
  SUITABLE_7_TO_12 = "suitable7to12",
  SUITABLE_OVER_12 = "suitableOver12",
  NOT_SUITABLE_UNDER_15 = "notSuitableUnder15",
  CHILDRENS_PROGRAM = "childrensProgram",
}

export const getGameTags = (game: Game): Tag[] => {
  if (!game.tags) return [];

  const tagsList: Tag[] = [];

  if (game.tags.includes("in-english")) {
    tagsList.push(Tag.IN_ENGLISH);
  }

  if (game.tags.includes("sopii-lapsille")) {
    tagsList.push(Tag.CHILDREN_FRIENDLY);
  }

  if (game.tags.includes("vain-taysi-ikaisille")) {
    tagsList.push(Tag.AGE_RESTRICTED);
  }

  if (game.tags.includes("aloittelijaystavallinen")) {
    tagsList.push(Tag.BEGINNER_FRIENDLY);
  }

  if (game.tags.includes("kunniavieras")) {
    tagsList.push(Tag.GUEST_OF_HONOR);
  }

  if (game.tags.includes("perheohjelma")) {
    tagsList.push(Tag.FAMILY);
  }

  if (game.tags.includes("teema-elementit")) {
    tagsList.push(Tag.THEME_ELEMENTS);
  }

  if (game.tags.includes("sopii-alle-7v-")) {
    tagsList.push(Tag.SUITABLE_UNDER_7);
  }

  if (game.tags.includes("sopii-7-12v-")) {
    tagsList.push(Tag.SUITABLE_7_TO_12);
  }

  if (game.tags.includes("sopii-yli-12v-")) {
    tagsList.push(Tag.SUITABLE_OVER_12);
  }

  if (game.tags.includes("ei-sovellu-alle-15v-")) {
    tagsList.push(Tag.NOT_SUITABLE_UNDER_15);
  }

  if (game.tags.includes("lastenohjelma")) {
    tagsList.push(Tag.CHILDRENS_PROGRAM);
  }

  if (game.intendedForExperiencedParticipants) {
    tagsList.push(Tag.FOR_EXPERIENCED_PARTICIPANTS);
  }

  return tagsList;
};
