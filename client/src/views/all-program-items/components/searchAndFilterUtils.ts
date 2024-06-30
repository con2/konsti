import { uniq } from "lodash-es";
import { Language, ProgramItem, Tag } from "shared/types/models/programItem";

const ignoredTags = [Tag.GUEST_OF_HONOR, Tag.THEME_MONSTERS];

export const getTagFilters = (programItems: readonly ProgramItem[]): Tag[] => {
  const tags = uniq([
    Tag.BEGINNER_FRIENDLY,
    Tag.ALL_AGES,
    Tag.AIMED_UNDER_13,
    Tag.AIMED_BETWEEN_13_17,
    Tag.AIMED_ADULTS,
    Tag.FOR_18_PLUS_ONLY,
    ...Object.values(Tag),
  ]);
  return tags
    .filter((tag) => {
      return programItems.some((programItem) => programItem.tags.includes(tag));
    })
    .filter((tag) => !ignoredTags.includes(tag));
};

const ignoredLanguages = [Language.LANGUAGE_FREE];

export const getLanguageFilters = (
  programItems: readonly ProgramItem[],
): Language[] => {
  const languages = uniq([
    Language.FINNISH,
    Language.ENGLISH,
    Language.SWEDISH,
    ...Object.values(Language),
  ]);
  return languages
    .filter((language) => {
      return programItems.some((programItem) =>
        programItem.languages.includes(language),
      );
    })
    .filter((language) => !ignoredLanguages.includes(language));
};
