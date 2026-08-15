import {
  DIRECT_SIGNUP_ONLY_TEXT,
  EVENT_LABELS,
  EVENT_ORDER,
  NO_RPGS_TEXT,
  bucketByHour,
  collectRpgLotteryParticipation,
  dayOfWeek,
  eventYears,
  pct,
  scaleNote,
  scaledBar,
  writeDoc,
} from "server/features/statistics/doc-generators/statsUtils";

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
  const { rpgIds, ownSlotsByUser, wonSlotsByUser, groupMemberSlotsByUser } =
    collectRpgLotteryParticipation(event, year);
  if (rpgIds.size === 0) return { year, kind: "no-rpgs" };

  const participants = new Set([
    ...ownSlotsByUser.keys(),
    ...wonSlotsByUser.keys(),
    ...groupMemberSlotsByUser.keys(),
  ]);
  if (participants.size === 0) {
    return { year, kind: "no-lottery" };
  }
  return {
    year,
    kind: "ok",
    participants: participants.size,
    winners: wonSlotsByUser.size,
  };
};

const renderYearSection = (event: string, year: string): string[] => {
  const { rpgIds, ownSlotsByUser, wonSlotsByUser, groupMemberSlotsByUser } =
    collectRpgLotteryParticipation(event, year);
  if (rpgIds.size === 0) {
    return [`### ${year}`, "", NO_RPGS_TEXT, ""];
  }

  // Own sign-ups, wins, and group participation all resolve to slot start
  // times, so every source lands in the same day-hour buckets
  const participantsByDayHour = new Map<string, Map<number, Set<string>>>();
  const addSlots = (username: string, slots: ReadonlySet<string>): void => {
    for (const slot of slots) {
      const { day, hour } = bucketByHour(slot);
      addToSet(participantsByDayHour, day, hour, username);
    }
  };
  for (const [username, slots] of ownSlotsByUser) addSlots(username, slots);
  for (const [username, slots] of groupMemberSlotsByUser) {
    addSlots(username, slots);
  }
  // A winner participated in the hour they won even when their own sign-up is
  // missing from the data
  for (const [username, slots] of wonSlotsByUser) addSlots(username, slots);

  const winnersByDayHour = new Map<string, Map<number, Set<string>>>();
  for (const [username, slots] of wonSlotsByUser) {
    for (const slot of slots) {
      const { day, hour } = bucketByHour(slot);
      addToSet(winnersByDayHour, day, hour, username);
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
    return [`### ${year}`, "", DIRECT_SIGNUP_ONLY_TEXT, ""];
  }

  // Winners are always added to the participant buckets, so winners can never
  // outnumber participants at any granularity; only the participants-without-
  // results case needs a fallback
  const out: string[] = [];
  if (totalWinners.size > 0) {
    out.push(
      `### ${year} (${totalParticipants.size} distinct participants, ${totalWinners.size} winners, ${pct(totalWinners.size, totalParticipants.size)})`,
      "",
    );
  } else {
    out.push(
      `### ${year} (${totalParticipants.size} distinct participants; win counts unavailable)`,
      "",
    );
  }

  const allDays = new Set([
    ...participantsByDayHour.keys(),
    ...winnersByDayHour.keys(),
  ]);
  for (const day of [...allDays].toSorted((a, b) => a.localeCompare(b))) {
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
    // Win data exists for the whole year or not at all, so a zero-winner day
    // still shows real counts instead of reading as missing data
    const dayHeader =
      totalWinners.size > 0
        ? `${day} (${dow}, ${dayP} participants, ${dayW} winners, ${pct(dayW, dayP)})`
        : `${day} (${dow}, ${dayP} participants, wins n/a)`;
    block.push(dayHeader, "");

    for (const hour of [...allHours].toSorted((a, b) => a - b)) {
      const p = (pHours as Map<number, Set<string>>).get(hour)?.size ?? 0;
      const w = (wHours as Map<number, Set<string>>).get(hour)?.size ?? 0;
      const pBars = Math.round(p / scale);
      let wBars = Math.min(pBars, Math.round(w / scale));
      // Keep real winners visible when there is room for both glyphs; at a
      // one-block bar the exact numbers beside the bar have to carry it
      if (w > 0 && wBars === 0 && pBars > 1) wBars = 1;
      const bar = "█".repeat(wBars) + "▄".repeat(Math.max(0, pBars - wBars));
      const label = `${String(hour).padStart(2, "0")}:00`;
      const numStr = `${w} / ${p} (${pct(w, p)})`;
      const sep = bar.length > 0 ? `${bar} ` : "";
      block.push(`${label} │ ${sep}${numStr}`);
    }
    block.push("", scaleNote(scale, "participant", "participants"), "```", "");
    out.push(...block);
  }

  return out;
};

export const genLotterySignups = (): void => {
  const eventSummaries = new Map<string, YearSummary[]>();
  for (const event of EVENT_ORDER) {
    const summaries: YearSummary[] = Array.from(eventYears(event), (year) =>
      collectSummary(event, year),
    );
    eventSummaries.set(event, summaries);
  }

  const out: string[] = [
    "# Lottery participants and wins by hour",
    "",
    "Per-hour count of distinct users who participated in the lottery and how many of them won a spot, grouped by day and event. Restricted to tabletop RPGs to match [RPG start times](rpg-start-times.md).",
    "",
    "Each user is counted once per hour regardless of how many priorities they submitted. A user counts as a winner for an hour if they won a spot in that hour's lottery, even if the program was later moved to another time.",
    "",
    "In each bar, `█` = winners, `▄` = participants who didn't win. Bar length = total participants for that hour. Blocks are rounded to the chart scale, so very small winner or loser shares may not show - the numbers beside each bar are exact. Hours with no lottery participants are omitted.",
    "",
    "Group members participate through the group creator's sign-ups without having them on their own user record, so they are counted from the group compositions stored with each assignment run - live records from Ropecon 2026 onward, backfilled from the event's final state for older events. Winners are always counted as participants of the hour they won.",
    "",
    "**Caveat:** some losing participants are missing from the data, so real participant counts are somewhat higher than shown and win rates somewhat lower (least so for Ropecon 2026, which records group compositions live):",
    "",
    "- Joining a group deleted the user's own sign-ups for upcoming program items in dumps before Ropecon 2026 (2017-2018 sign-ups were restored from old result snapshots).",
    "- The backfilled group records of older events reflect each group's final membership: anyone who left a group before the event ended is missed, and late joiners are counted for earlier slots they never entered (a small overcount in the other direction).",
    "- Program items moved or deleted after a lottery run erase the matching sign-ups, which can hide a losing group even in 2026 data.",
    "",
  ];

  for (const event of EVENT_ORDER) {
    const summaries = eventSummaries.get(event) ?? [];
    if (summaries.length === 0) continue;

    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");
    if (summaries.every((t) => t.kind === "no-rpgs")) {
      out.push(NO_RPGS_TEXT, "");
      continue;
    }
    if (summaries.every((t) => t.kind !== "ok")) {
      out.push(DIRECT_SIGNUP_ONLY_TEXT, "");
      continue;
    }

    const okItems = summaries.flatMap((t) => (t.kind === "ok" ? [t] : []));
    const maxParticipants = Math.max(...okItems.map((t) => t.participants));

    const summaryBlock: string[] = [
      "**Overall win rate by year** (bar length = participants relative to the busiest year, `█` = winners, `▄` = participants who didn't win):",
      "",
      "```",
    ];
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
    "- Programs cancelled after their lottery ran are included: their sign-ups and wins count even though the program never happened.",
    "- Wins on program items deleted from the data cannot be identified as RPGs and are not counted: 9 result rows in Tracon Hitpoint 2023, 6 in Tracon Hitpoint 2024, and 5 in Ropecon 2026.",
    "",
  );

  writeDoc("lottery-signups.md", out.join("\n"));
};
