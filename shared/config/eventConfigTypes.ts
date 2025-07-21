import { Dayjs } from "dayjs";
import { Language, ProgramType, Tag } from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";

export enum EventSignupStrategy {
  DIRECT = "direct",
  LOTTERY = "lottery",
  LOTTERY_AND_DIRECT = "lottery+direct",
}

export enum AssignmentAlgorithm {
  PADG = "padg",
  RANDOM = "random",
  RANDOM_PADG = "random+padg",
}

export enum LoginProvider {
  LOCAL = "local",
  KOMPASSI = "kompassi",
  LOCAL_KOMPASSI = "local+kompassi",
}

export enum EventName {
  ROPECON = "Ropecon",
  HITPOINT = "Tracon Hitpoint",
  SOLMUKOHTA = "Solmukohta",
  TRACON = "Tracon",
}

type ArrMin1<T> = [T, ...T[]];

interface SignupWindow {
  signupWindowStart: Dayjs;
  signupWindowClose: Dayjs;
}

export enum EntryConditionText {
  K16 = "k16",
  K18 = "k18",
}

export interface EventConfig {
  assignmentAlgorithm: AssignmentAlgorithm;
  enableGroups: boolean;
  eventName: EventName;
  eventYear: string;
  eventStartTime: string;
  directSignupPhaseStart: number;
  preSignupStart: number;
  phaseGap: number;
  directSignupWindows: Partial<
    Record<ProgramType, ArrMin1<SignupWindow>>
  > | null;
  rollingDirectSignupProgramTypes: ProgramType[];
  enableRollingDirectSignupPreviousDay: boolean;
  directSignupAlwaysOpenIds: string[];
  requireRegistrationCode: boolean;
  twoPhaseSignupProgramTypes: ProgramType[];
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonstiOther: string[];
  noKonstiSignupIds: string[];
  ignoreProgramItemsIds: string[];
  signupQuestions: SignupQuestion[];
  tournamentSignupQuestion: Omit<SignupQuestion, "programItemId"> | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
  logInvalidStartTimes: boolean;
  logMissingScheduleItems: boolean; // If scheduleItems is missing, program item is ignored
  hideParticipantListProgramTypes: ProgramType[];
  fixedLotterySignupTime: string | null;
  entryConditions: {
    conditionText: EntryConditionText;
    programItemIds: string[];
  }[];
  directSignupOpenToEndProgramTypes: ProgramType[];
  activeProgramTypes: ProgramType[];
  enableRemoveOverlapSignups: boolean;
  customDetailsProgramItems: Record<
    string,
    | {
        tags?: Tag[];
        languages?: Language[];
      }
    | undefined
  >;
  enableRevolvingDoor: boolean;
  programGuideUrl: string;
}
