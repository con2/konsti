import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import { config } from "shared/config";
import { TIMEZONE } from "shared/utils/initializeDayjs";

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
  if (denom === 0) return "—";
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
