import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { PastEvent } from "shared/config/past-events";
import {
  AgeGroup,
  Gamestyle,
  Genre,
  InclusivityValue,
  Language,
  ProgramItem,
  ProgramItemSchema,
  ProgramType,
  Tag,
} from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { LotterySignup, UserGroup } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { UserDirectSignup } from "server/features/direct-signup/directSignupTypes";
import { jsonFileExists, readJson } from "server/features/statistics/statsUtil";

// The dump's own shapes, which are not the models: they carry the DB metadata the models
// leave out, and the oldest of them predate fields the models now require
interface DumpUser {
  kompassiId: string;
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  isGroupCreator: boolean;
  favoriteProgramItemIds: string[];
  lotterySignups: LotterySignup[];
  email?: string;
  emailNotificationPermitAsked?: boolean;
}

interface DumpDirectSignup {
  programItemId: string;
  userSignups: UserDirectSignup[];
}

interface DumpResult {
  assignmentTime: string;
  algorithm: string;
  message: string;
  results: UserAssignmentResult[];
}

export interface PastEventDump {
  programItems: ProgramItem[];
  users: DumpUser[];
  directSignups: DumpDirectSignup[];
  recordedRuns: DumpResult[];
}

// Descriptive fields whose enums have gained and lost values over the years. The lottery reads
// none of them, and the one that is read anywhere near it - the pre-convention week tag - is a
// value the current code still has, so an unrecognized entry cannot be it.
const retiredValueFields: Record<string, string[]> = {
  tags: Object.values(Tag),
  ageGroups: Object.values(AgeGroup),
  genres: Object.values(Genre),
  styles: Object.values(Gamestyle),
  languages: Object.values(Language),
  accessibilityValues: Object.values(InclusivityValue),
};

const dropRetiredValues = (
  dumpProgramItem: Record<string, unknown>,
): Record<string, unknown> => {
  const kept = Object.entries(retiredValueFields).map(
    ([field, currentValues]): [string, unknown] => {
      const dumpValues: unknown = dumpProgramItem[field];
      if (!Array.isArray(dumpValues)) {
        return [field, dumpValues];
      }
      return [
        field,
        dumpValues.filter(
          (value: unknown) =>
            typeof value === "string" && currentValues.includes(value),
        ),
      ];
    },
  );
  return { ...dumpProgramItem, ...Object.fromEntries(kept) };
};

// Everything a program item needs that a dump may not carry. `parentId` arrived with Tracon
// 2025 and the lottery reads it on every item; the two marks are the lottery's own work and
// the replay has to start without them, whatever a re-dumped file might hold.
const toProgramItem = (dumpProgramItem: unknown): ProgramItem => {
  const withDefaults = {
    parentId: (dumpProgramItem as ProgramItem).programItemId,
    ...dropRetiredValues(dumpProgramItem as Record<string, unknown>),
    lotteryRanForStartTime: undefined,
    passedOverForLottery: undefined,
  };
  return ProgramItemSchema.parse(withDefaults);
};

// A program type the codebase has dropped cannot be replayed: whether the lottery takes an
// item turns on it, so coercing it to something current would decide the run rather than
// reproduce it. Reported as a reason to skip the event instead of a parse failure.
const findRetiredProgramTypes = (
  dumpProgramItems: readonly unknown[],
): string[] => {
  const current: string[] = Object.values(ProgramType);
  const dumpTypes = dumpProgramItems.map(
    (dumpProgramItem) => (dumpProgramItem as ProgramItem).programType as string,
  );
  return [...new Set(dumpTypes)].filter(
    (programType) => !current.includes(programType),
  );
};

export const readPastEventDump = (
  pastEvent: PastEvent,
): Result<PastEventDump, string> => {
  const { datafileDir, year } = pastEvent;
  const yearNumber = Number(year);

  const dumpProgramItems = readJson<unknown>(
    datafileDir,
    yearNumber,
    "program-items",
  );
  const retiredProgramTypes = findRetiredProgramTypes(dumpProgramItems);
  if (retiredProgramTypes.length > 0) {
    return makeErrorResult(
      `its programme uses program types the codebase no longer has: ${retiredProgramTypes.join(", ")}`,
    );
  }

  return makeSuccessResult({
    programItems: dumpProgramItems.map(toProgramItem),
    users: readJson<DumpUser>(datafileDir, yearNumber, "users"),
    directSignups: readJson<DumpDirectSignup>(
      datafileDir,
      yearNumber,
      "direct-signups",
    ),
    // Ropecon 2021 ran no lottery at all, so it has no results file and nothing to replay
    recordedRuns: jsonFileExists(datafileDir, yearNumber, "results")
      ? readJson<DumpResult>(datafileDir, yearNumber, "results")
      : [],
  });
};

// Returns nothing rather than falling back, so an unknown name is reported instead of
// quietly replaying with something else
export const parseAssignmentAlgorithm = (
  algorithm: string,
): AssignmentAlgorithm | undefined => {
  const algorithms: string[] = Object.values(AssignmentAlgorithm);
  return algorithms.includes(algorithm)
    ? (algorithm as AssignmentAlgorithm)
    : undefined;
};
