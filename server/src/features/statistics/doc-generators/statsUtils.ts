import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import { config } from "shared/config";
import { TIMEZONE } from "shared/utils/initializeDayjs";
import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
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

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayHourBucket {
  day: string;
  hour: number;
}

export const bucketByHour = (time: string): DayHourBucket => {
  const local = dayjs(time).tz(TIMEZONE);
  const day = `${local.year()}-${String(local.month() + 1).padStart(2, "0")}-${String(local.date()).padStart(2, "0")}`;
  return { day, hour: local.hour() };
};

export const dayOfWeek = (isoDay: string): string => {
  const d = dayjs(`${isoDay}T12:00:00Z`).tz(TIMEZONE);
  return SHORT_WEEKDAYS[d.day()];
};

export const pct = (num: number, denom: number): string => {
  if (denom === 0) return "n/a";
  return `${((num / denom) * 100).toFixed(1)}%`;
};

// Proportional bar at fixed width: filled vs unfilled
export const fixedBar = (filled: number, total: number, width = 30): string => {
  if (total === 0) return "▄".repeat(width);
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

export const writeDoc = (relPath: string, content: string): void => {
  const fullPath = path.join("../docs/statistics", relPath);
  fs.writeFileSync(fullPath, content);
};

export interface RpgLotteryParticipation {
  // Non-cancelled tabletop RPG program item ids
  rpgIds: Set<string>;
  // Slot start times of each user's own RPG lottery sign-ups
  ownSlotsByUser: Map<string, Set<string>>;
  // Distinct slot start times each user won, deduped across lottery re-runs
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
  const rpgIds = new Set(
    items
      .filter(
        (i) =>
          i.programType === ProgramType.TABLETOP_RPG &&
          i.state !== State.CANCELLED,
      )
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
        addSlot(wonSlotsByUser, result.username, signup.signedToStartTime);
        addSlot(runWinSlotsByUser, result.username, signup.signedToStartTime);
      }

      // A run's group snapshots cover every two-phase program type, so gate
      // per group: it entered this run's RPG lottery only if the creator has a
      // matching RPG sign-up, or a member won an RPG in this run (backfilled
      // groups can lack the creator's sign-ups)
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
