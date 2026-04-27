import { ResultsCollectionEntry } from "server/types/resultTypes";
import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import {
  bucketByHour,
  dataFileExists,
  dayOfWeek,
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  pct,
  readDataFile,
  scaledBar,
  writeDoc,
} from "server/features/statistics/doc-generators/helpers";

type YearSummary =
  | { year: string; kind: "no-rpgs" }
  | { year: string; kind: "no-lottery" }
  | { year: string; kind: "ok"; participants: number; winners: number };

const addToSet = (
  map: Map<string, Map<number, Set<string>>>,
  day: string,
  hour: number,
  value: string,
): void => {
  let hours = map.get(day);
  if (!hours) {
    hours = new Map();
    map.set(day, hours);
  }
  let set = hours.get(hour);
  if (!set) {
    set = new Set();
    hours.set(hour, set);
  }
  set.add(value);
};

const collectSummary = (event: string, year: string): YearSummary => {
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
  if (rpgIds.size === 0) return { year, kind: "no-rpgs" };

  const users = readDataFile(event, year, "users.json") as User[];
  const participants = new Set<string>();
  for (const u of users) {
    for (const ls of u.lotterySignups) {
      if (rpgIds.has(ls.programItemId)) participants.add(u.username);
    }
  }
  const winners = new Set<string>();
  if (dataFileExists(event, year, "results.json")) {
    const runs = readDataFile(
      event,
      year,
      "results.json",
    ) as ResultsCollectionEntry[];
    for (const run of runs) {
      for (const r of run.results) {
        if (rpgIds.has(r.assignmentSignup.programItemId)) {
          winners.add(r.username);
        }
      }
    }
  }
  if (participants.size === 0 && winners.size === 0) {
    return { year, kind: "no-lottery" };
  }
  return {
    year,
    kind: "ok",
    participants: participants.size,
    winners: winners.size,
  };
};

const renderYearSection = (event: string, year: string): string[] => {
  const items = readDataFile(
    event,
    year,
    "program-items.json",
  ) as ProgramItem[];
  const rpgIdSet = new Set<string>();
  for (const i of items) {
    if (
      i.programType === ProgramType.TABLETOP_RPG &&
      i.state !== State.CANCELLED
    ) {
      rpgIdSet.add(i.programItemId);
    }
  }
  if (rpgIdSet.size === 0) {
    return [`### ${year}`, "", "No tabletop RPGs in this event.", ""];
  }

  const users = readDataFile(event, year, "users.json") as User[];
  const participantsByDayHour = new Map<string, Map<number, Set<string>>>();
  for (const u of users) {
    for (const ls of u.lotterySignups) {
      if (!rpgIdSet.has(ls.programItemId)) continue;
      const { day, hour } = bucketByHour(ls.signedToStartTime);
      addToSet(participantsByDayHour, day, hour, u.username);
    }
  }

  const winnersByDayHour = new Map<string, Map<number, Set<string>>>();
  if (dataFileExists(event, year, "results.json")) {
    const runs = readDataFile(
      event,
      year,
      "results.json",
    ) as ResultsCollectionEntry[];
    for (const run of runs) {
      for (const r of run.results) {
        const sig = r.assignmentSignup;
        if (!rpgIdSet.has(sig.programItemId)) continue;
        const { day, hour } = bucketByHour(sig.signedToStartTime);
        addToSet(winnersByDayHour, day, hour, r.username);
      }
    }
  }

  const totalParticipants = new Set<string>();
  for (const m of participantsByDayHour.values()) {
    for (const set of m.values()) {
      for (const u of set) totalParticipants.add(u);
    }
  }
  const totalWinners = new Set<string>();
  for (const m of winnersByDayHour.values()) {
    for (const set of m.values()) {
      for (const u of set) totalWinners.add(u);
    }
  }

  if (totalParticipants.size === 0 && totalWinners.size === 0) {
    return [
      `### ${year}`,
      "",
      "Tabletop RPGs at this event use direct signup, not lottery.",
      "",
    ];
  }

  const out: string[] = [];
  if (totalParticipants.size > 0 && totalWinners.size > 0) {
    out.push(
      `### ${year} (${totalParticipants.size} distinct participants, ${totalWinners.size} winners, ${pct(totalWinners.size, totalParticipants.size)})`,
      "",
    );
  } else if (totalParticipants.size > 0) {
    out.push(
      `### ${year} (${totalParticipants.size} distinct participants; win counts unavailable)`,
      "",
    );
  } else {
    out.push(
      `### ${year} (${totalWinners.size} winners; participant counts unavailable)`,
      "",
    );
  }

  const allDays = new Set([
    ...participantsByDayHour.keys(),
    ...winnersByDayHour.keys(),
  ]);
  for (const day of [...allDays].sort()) {
    const pHours = participantsByDayHour.get(day) ?? new Map();
    const wHours = winnersByDayHour.get(day) ?? new Map();
    const allHours = new Set([
      ...(pHours as Map<number, Set<string>>).keys(),
      ...(wHours as Map<number, Set<string>>).keys(),
    ]);

    const dayPSet = new Set<string>();
    const dayWSet = new Set<string>();
    for (const set of (pHours as Map<number, Set<string>>).values()) {
      for (const u of set) dayPSet.add(u);
    }
    for (const set of (wHours as Map<number, Set<string>>).values()) {
      for (const u of set) dayWSet.add(u);
    }
    const dayP = dayPSet.size;
    const dayW = dayWSet.size;
    const dow = dayOfWeek(day);

    const maxHourP = Math.max(
      0,
      ...[...allHours].map(
        (h) => (pHours as Map<number, Set<string>>).get(h)?.size ?? 0,
      ),
    );
    const scale = Math.max(1, Math.ceil(maxHourP / 40));

    const block: string[] = ["```"];
    let dayHeader: string;
    if (dayP > 0 && dayW > 0) {
      dayHeader = `${day} (${dow}, ${dayP} participants, ${dayW} winners, ${pct(dayW, dayP)})`;
    } else if (dayP > 0) {
      dayHeader = `${day} (${dow}, ${dayP} participants, wins n/a)`;
    } else {
      dayHeader = `${day} (${dow}, ${dayW} winners, participants n/a)`;
    }
    block.push(dayHeader, "");

    for (const hour of [...allHours].sort((a, b) => a - b)) {
      const p = (pHours as Map<number, Set<string>>).get(hour)?.size ?? 0;
      const w = (wHours as Map<number, Set<string>>).get(hour)?.size ?? 0;
      const pBars = Math.round(p / scale);
      const wBars = Math.min(pBars, Math.round(w / scale));
      const bar = "█".repeat(wBars) + "▄".repeat(Math.max(0, pBars - wBars));
      const label = `${String(hour).padStart(2, "0")}:00`;
      const numStr = p > 0 ? `${w} / ${p} (${pct(w, p)})` : `${w} winners`;
      const sep = bar.length > 0 ? `${bar} ` : "";
      block.push(`${label} │ ${sep}${numStr}`);
    }
    if (scale > 1) {
      block.push("", `(scale: 1 block ≈ ${scale} participants)`);
    }
    block.push("```", "");
    out.push(...block);
  }

  return out;
};

export const genLotterySignups = (): void => {
  const eventSummaries = new Map<string, YearSummary[]>();
  for (const event of EVENT_ORDER) {
    const summaries: YearSummary[] = [];
    for (const year of eventYears(event)) {
      summaries.push(collectSummary(event, year));
    }
    eventSummaries.set(event, summaries);
  }

  const out: string[] = [
    "# Lottery Participants and Wins by Hour",
    "",
    "Per-hour count of distinct users who participated in the lottery and how many of them won a seat, grouped by day and event. Restricted to tabletop RPGs to match [RPG Start Times](rpg-start-times.md).",
    "",
    "Each user is counted once per hour regardless of how many priorities they submitted. A user counts as a winner for an hour if any of their lottery wins lands on a program starting in that hour.",
    "",
    "In each bar, `█` = winners, `▄` = participants who didn't win. Bar length = total participants for that hour.",
    "",
    "**Caveat:** `lotterySignups` can be incomplete — entries are removed if a user joins a group after the lottery. Every winner's _winning_ lottery signup is preserved (or restored from `results.json`), so each result entry is also a participant; but a user's _non-winning_ preferences for the same timeslot may be missing. For 2017–2018 the older per-result snapshot covered all preferences, so even those are restored.",
    "",
  ];

  for (const event of EVENT_ORDER) {
    const summaries = eventSummaries.get(event) ?? [];
    if (summaries.length === 0) continue;

    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");
    if (summaries.every((t) => t.kind === "no-rpgs")) {
      out.push("No tabletop RPGs at this event.", "");
      continue;
    }
    if (summaries.every((t) => t.kind !== "ok")) {
      out.push(
        "Tabletop RPGs at this event use direct signup, not lottery.",
        "",
      );
      continue;
    }

    const okItems = summaries.flatMap((t) => (t.kind === "ok" ? [t] : []));
    const maxParticipants = Math.max(...okItems.map((t) => t.participants));

    const summaryBlock: string[] = ["**Overall win rate by year:**", "", "```"];
    for (const t of summaries) {
      if (t.kind === "no-rpgs") {
        summaryBlock.push(`${t.year} (no RPGs)`);
      } else if (t.kind === "no-lottery") {
        summaryBlock.push(`${t.year} (no lottery)`);
      } else {
        const rate = pct(t.winners, t.participants).padStart(6);
        summaryBlock.push(
          `${t.year} ${scaledBar(t.winners, t.participants, maxParticipants, 35)} ${rate}  (${t.winners} / ${t.participants})`,
        );
      }
    }
    summaryBlock.push("```", "");
    out.push(...summaryBlock);

    for (const year of eventYears(event)) {
      out.push(...renderYearSection(event, year));
    }
  }

  out.push(
    "## Notes",
    "",
    "- A user counts at most once per hour even if they submitted multiple priorities.",
    "",
  );

  writeDoc("lottery-signups.md", out.join("\n"));
};
