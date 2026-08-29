import { Locale } from "shared/types/locale";
import { ProgramType } from "shared/types/models/programItem";

// Emails are written in both languages at once and the server has no i18next instance, so the
// names the client reads from its locale files are repeated here. Typed as a full record, so
// adding a program type is a compile error rather than a message with a blank in it
const PLURAL_NAMES: Record<ProgramType, Record<Locale, string>> = {
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
  [ProgramType.FLEAMARKET]: {
    fi: "kirpputoriajat",
    en: "flea market times",
  },
  [ProgramType.OTHER_GAMING]: { fi: "muu pelaaminen", en: "other gaming" },
};

export const getProgramTypePluralName = (
  programType: ProgramType,
  locale: Locale,
): string => PLURAL_NAMES[programType][locale];
