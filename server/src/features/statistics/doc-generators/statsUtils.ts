import fs from "node:fs";
import path from "node:path";
import { TZDate } from "@date-fns/tz";
import { config } from "shared/config";
import {
  ProgramItem,
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import {
  getIsoDate,
  getShortWeekdayInEnglish,
} from "shared/utils/timeFormatter";
import { TIMEZONE } from "shared/utils/timezone";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ResultsCollectionEntry } from "server/types/resultTypes";

export const EVENT_LABELS: Record<string, string> = {
  ropecon: "Ropecon",
  "tracon-hitpoint": "Tracon Hitpoint",
  tracon: "Tracon",
  solmukohta: "Solmukohta",
};

export const EVENT_ORDER = [
  "ropecon",
  "tracon-hitpoint",
  "tracon",
  "solmukohta",
];

// Shared empty-state texts so the generated docs cannot drift apart
export const NO_RPGS_TEXT = "No tabletop RPGs at this event.";
export const DIRECT_SIGNUP_ONLY_TEXT =
  "Tabletop RPGs at this event used direct sign-up, not lottery.";

interface DayHourBucket {
  day: string;
  hour: number;
}

export const bucketByHour = (time: string): DayHourBucket => ({
  day: getIsoDate(time),
  hour: new TZDate(time, TIMEZONE).getHours(),
});

// Midday, so the day cannot roll over into its neighbour in the event timezone
export const dayOfWeek = (isoDay: string): string =>
  getShortWeekdayInEnglish(`${isoDay}T12:00:00Z`);

export const pct = (num: number, denom: number): string => {
  if (denom === 0) return "n/a";
  return `${((num / denom) * 100).toFixed(1)}%`;
};

// Chart scale legend, printed for every chart so 1:1 charts are explicit too
export const scaleNote = (
  scale: number,
  singular: string,
  plural: string,
): string =>
  scale > 1
    ? `(scale: 1 block ≈ ${scale} ${plural})`
    : `(scale: 1 block = 1 ${singular})`;

// Proportional bar at fixed width: filled vs unfilled
export const fixedBar = (filled: number, total: number, width = 30): string => {
  if (total === 0) return " ".repeat(width);
  const f = Math.min(width, Math.round((filled / total) * width));
  return "█".repeat(f) + "▄".repeat(width - f);
};

// Variable-width bar where total length scales with `total` against `maxTotal`,
// and the filled portion is `filled / maxTotal` of the same scale. Pads the
// trailing whitespace so subsequent columns align.
export const scaledBar = (
  filled: number,
  total: number,
  maxTotal: number,
  width = 35,
): string => {
  if (maxTotal === 0) return " ".repeat(width);
  const totalChars = Math.max(1, Math.round((total / maxTotal) * width));
  const fillChars = Math.min(
    totalChars,
    Math.round((filled / maxTotal) * width),
  );
  const bar = "█".repeat(fillChars) + "▄".repeat(totalChars - fillChars);
  return bar + " ".repeat(width - totalChars);
};

const dataPath = (event: string, year: string, file: string): string =>
  path.join(config.server().statsDataDir, event, year, file);

export const dataFileExists = (
  event: string,
  year: string,
  file: string,
): boolean => fs.existsSync(dataPath(event, year, file));

export const readDataFile = (
  event: string,
  year: string,
  file: string,
): unknown => JSON.parse(fs.readFileSync(dataPath(event, year, file), "utf8"));

export const eventYears = (event: string): string[] => {
  const dir = path.join(config.server().statsDataDir, event);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).toSorted((a, b) => a.localeCompare(b));
};

// A datafile directory not listed in EVENT_ORDER would silently vanish from
// every generated doc, so callers should fail the run on a non-empty result
export const unknownEventDirs = (): string[] => {
  const dirs = fs
    .readdirSync(config.server().statsDataDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  return dirs.filter((dir) => !EVENT_ORDER.includes(dir));
};

// Data invariants the generators rely on; violations should fail the run
// instead of silently skewing the published statistics
export const datafileViolations = (): string[] => {
  const violations: string[] = [];
  for (const event of EVENT_ORDER) {
    for (const year of eventYears(event)) {
      const items = readDataFile(
        event,
        year,
        "program-items.json",
      ) as ProgramItem[];
      const noSignupItems = new Set<string>();
      for (const i of items) {
        if (i.signupType === SignupType.KONSTI && i.maxAttendance === 0) {
          violations.push(
            `${event}/${year}: ${i.programItemId} uses Konsti sign-up but has maxAttendance 0`,
          );
        }
        if (i.signupType !== SignupType.KONSTI || i.state === State.CANCELLED) {
          noSignupItems.add(i.programItemId);
        }
      }
      if (!dataFileExists(event, year, "direct-signups.json")) continue;
      const ds = readDataFile(
        event,
        year,
        "direct-signups.json",
      ) as DirectSignupsForProgramItem[];
      for (const entry of ds) {
        if (
          noSignupItems.has(entry.programItemId) &&
          entry.userSignups.length > 0
        ) {
          violations.push(
            `${event}/${year}: ${entry.programItemId} is cancelled or non-Konsti but holds sign-ups`,
          );
        }
      }
    }
  }
  return violations;
};

export const writeDoc = (relPath: string, content: string): void => {
  const fullPath = path.join("../docs/statistics", relPath);
  fs.writeFileSync(fullPath, content);
};

export interface RpgLotteryParticipation {
  // Tabletop RPG program item ids, including programs cancelled after their
  // lottery ran
  rpgIds: Set<string>;
  // Slot start times of each user's own RPG lottery sign-ups
  ownSlotsByUser: Map<string, Set<string>>;
  // Distinct slots (assignment times) each user won, deduped across
  // duplicated result rows
  wonSlotsByUser: Map<string, Set<string>>;
  // Slot start times each user entered via their group: members participate
  // through the creator's sign-ups without carrying them on their own record
  groupMemberSlotsByUser: Map<string, Set<string>>;
}

const participationCache = new Map<string, RpgLotteryParticipation>();

const addSlot = (
  map: Map<string, Set<string>>,
  username: string,
  slot: string,
): void => {
  let slots = map.get(username);
  if (!slots) {
    slots = new Set();
    map.set(username, slots);
  }
  slots.add(slot);
};

// Single source of truth for who took part in the RPG lottery and what they
// won, shared by the doc generators so their counts cannot drift apart
export const collectRpgLotteryParticipation = (
  event: string,
  year: string,
): RpgLotteryParticipation => {
  const cacheKey = `${event}/${year}`;
  const cached = participationCache.get(cacheKey);
  if (cached) return cached;

  const items = readDataFile(
    event,
    year,
    "program-items.json",
  ) as ProgramItem[];
  // Cancelled programs stay in: their lotteries ran before cancellation, so
  // their sign-ups and wins belong in the lottery statistics
  const rpgIds = new Set(
    items
      .filter((i) => i.programType === ProgramType.TABLETOP_RPG)
      .map((i) => i.programItemId),
  );

  const users = readDataFile(event, year, "users.json") as User[];
  const ownSlotsByUser = new Map<string, Set<string>>();
  for (const u of users) {
    for (const ls of u.lotterySignups) {
      if (rpgIds.has(ls.programItemId)) {
        addSlot(ownSlotsByUser, u.username, ls.signedToStartTime);
      }
    }
  }

  const wonSlotsByUser = new Map<string, Set<string>>();
  const groupMemberSlotsByUser = new Map<string, Set<string>>();
  if (dataFileExists(event, year, "results.json")) {
    const runs = readDataFile(
      event,
      year,
      "results.json",
    ) as ResultsCollectionEntry[];
    for (const run of runs) {
      const runWinSlotsByUser = new Map<string, Set<string>>();
      for (const result of run.results) {
        const signup = result.assignmentSignup;
        if (!rpgIds.has(signup.programItemId)) continue;
        // Key wins by the run's assignment time - by definition the slot the
        // run assigned; the sign-up's own stamp legitimately diverges only
        // for parent-batched non-RPG items
        addSlot(wonSlotsByUser, result.username, run.assignmentTime);
        addSlot(runWinSlotsByUser, result.username, run.assignmentTime);
      }

      // A run's group snapshots cover every two-phase program type, so gate
      // per group: it entered this run's RPG lottery only if the creator has a
      // matching RPG sign-up, or a member won an RPG in this run (backfilled
      // groups can lack the creator's sign-ups, and program items moved or
      // deleted after a run erase the matching sign-ups even in live records)
      for (const group of run.groups) {
        const slots = new Set<string>();
        for (const slot of ownSlotsByUser.get(group.groupCreator) ?? []) {
          if (slot === run.assignmentTime) slots.add(slot);
        }
        for (const member of group.groupMembers) {
          for (const slot of runWinSlotsByUser.get(member) ?? []) {
            slots.add(slot);
          }
        }
        if (slots.size === 0) continue;
        for (const member of group.groupMembers) {
          for (const slot of slots) {
            addSlot(groupMemberSlotsByUser, member, slot);
          }
        }
      }
    }
  }

  const participation = {
    rpgIds,
    ownSlotsByUser,
    wonSlotsByUser,
    groupMemberSlotsByUser,
  };
  participationCache.set(cacheKey, participation);
  return participation;
};

export interface RpgSpotCounts {
  // Non-cancelled Konsti-signup RPGs with an attendance limit - the programs
  // whose spots can be filled at all
  konstiRpgs: ProgramItem[];
  spotsByItem: Map<string, number>;
}

// Spots filled per RPG program item, from the final sign-up data. The item
// selection lives here so every consumer publishes matching spot totals.
// Tracon Hitpoint 2019 is the exception: a bug at that event kept only each
// user's last lottery win in the final data (which loses a third of the
// spots), so its counts come from the assignment results instead - the event
// was lottery-only, so the results cover every spot, though a few spots users
// gave up afterwards are included.
const spotsCache = new Map<string, RpgSpotCounts>();

export const collectRpgSpotCounts = (
  event: string,
  year: string,
): RpgSpotCounts => {
  const cacheKey = `${event}/${year}`;
  const cachedSpots = spotsCache.get(cacheKey);
  if (cachedSpots) return cachedSpots;

  const items = readDataFile(
    event,
    year,
    "program-items.json",
  ) as ProgramItem[];
  const konstiRpgs = items.filter(
    (i) =>
      i.programType === ProgramType.TABLETOP_RPG &&
      i.state !== State.CANCELLED &&
      i.signupType === SignupType.KONSTI &&
      i.maxAttendance > 0,
  );
  const rpgIds = new Set(konstiRpgs.map((i) => i.programItemId));
  const spotsByItem = new Map<string, number>();

  if (event === "tracon-hitpoint" && year === "2019") {
    const runs = readDataFile(
      event,
      year,
      "results.json",
    ) as ResultsCollectionEntry[];
    // Dedup guards against exactly duplicated result rows, which occur in
    // other old dumps
    const seen = new Set<string>();
    for (const run of runs) {
      for (const result of run.results) {
        const id = result.assignmentSignup.programItemId;
        if (!rpgIds.has(id)) continue;
        const key = `${result.username}|${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        spotsByItem.set(id, (spotsByItem.get(id) ?? 0) + 1);
      }
    }
    const resultSpots = { konstiRpgs, spotsByItem };
    spotsCache.set(cacheKey, resultSpots);
    return resultSpots;
  }

  if (dataFileExists(event, year, "direct-signups.json")) {
    const ds = readDataFile(
      event,
      year,
      "direct-signups.json",
    ) as DirectSignupsForProgramItem[];
    for (const entry of ds) {
      if (!rpgIds.has(entry.programItemId)) continue;
      // Count the userSignups array itself rather than trusting the
      // denormalized count field
      spotsByItem.set(
        entry.programItemId,
        (spotsByItem.get(entry.programItemId) ?? 0) + entry.userSignups.length,
      );
    }
  }
  const spots = { konstiRpgs, spotsByItem };
  spotsCache.set(cacheKey, spots);
  return spots;
};
