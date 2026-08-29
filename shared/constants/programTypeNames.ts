import { mapValues } from "remeda";
import { Locale } from "shared/types/locale";
import { ProgramType } from "shared/types/models/programItem";

// The plural name of every program type, in both languages. It lives here rather than only in
// the client's locale files because the server writes the same names into emails and has no
// i18next instance to read them from. Names, not translation keys, so this stays platform
// neutral - see the dependency rule in shared/CLAUDE.md
const PROGRAM_TYPE_PLURAL_NAMES: Record<ProgramType, Record<Locale, string>> = {
  [ProgramType.TABLETOP_RPG]: { fi: "roolipelit", en: "role-playing games" },
  [ProgramType.LARP]: { fi: "larpit", en: "larps" },
  [ProgramType.TOURNAMENT]: { fi: "turnaukset", en: "tournaments" },
  [ProgramType.WORKSHOP]: { fi: "työpajat", en: "workshops" },
  [ProgramType.EXPERIENCE_POINT]: { fi: "pelit", en: "games" },
  [ProgramType.OTHER]: { fi: "ohjelmanumerot", en: "program items" },
  [ProgramType.ROUNDTABLE_DISCUSSION]: {
    fi: "keskustelupiirit",
    en: "roundtable discussions",
  },
  [ProgramType.FLEAMARKET]: { fi: "kirpputoriajat", en: "flea market times" },
  [ProgramType.OTHER_GAMING]: { fi: "muu pelaaminen", en: "other gaming" },
  [ProgramType.BOARDGAME]: { fi: "lautapelit", en: "board games" },
};

// Spread into the locale files' `programTypePlural`, so the translations and the emails cannot
// drift apart
export const getProgramTypePluralNames = (
  locale: Locale,
): Record<ProgramType, string> =>
  mapValues(PROGRAM_TYPE_PLURAL_NAMES, (names) => names[locale]);

export const getProgramTypePluralName = (
  programType: ProgramType,
  locale: Locale,
): string => PROGRAM_TYPE_PLURAL_NAMES[programType][locale];
