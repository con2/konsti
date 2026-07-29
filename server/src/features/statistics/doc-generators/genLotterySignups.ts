import {
  bucketByHour,
  collectRpgLotteryParticipation,
  dayOfWeek,
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  pct,
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
    return [`### ${year}`, "", "No tabletop RPGs in this event.", ""];
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
    return [
      `### ${year}`,
      "",
      "Tabletop RPGs at this event use direct sign-up, not lottery.",
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
    let dayHeader: string;
    if (dayP > 0 && dayW > 0) {
      dayHeader = `${day} (${dow}, ${dayP} participants, ${dayW} winners, ${pct(dayW, dayP)})`;
    } else if (dayP > 0) {
      dayHeader = `${day} (${dow}, ${dayP} participants, wins n/a)`;
    } else {
      dayHeader = `${day} (${dow}, ${dayW} winners, participants n/a)`;
    }
    block.push(dayHeader, "");

    for (const hour of [...allHours].toSorted((a, b) => a - b)) {
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
    const summaries: YearSummary[] = Array.from(eventYears(event), (year) =>
      collectSummary(event, year),
    );
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
    "Group members participate through the group creator's sign-ups without having them on their own user record, so they are counted from the group compositions stored with each assignment run - live records from Ropecon 2026 onward, backfilled from the event's final state for older events. Winners are always counted as participants of the hour they won.",
    "",
    "**Caveat:** some losing participants are missing from the data: joining a group deleted the user's own lottery sign-ups in dumps before Ropecon 2026 (2017–2018 were restored from old result snapshots), the backfilled group records of older events miss anyone who left a group before the end, and winning a seat removes the user's overlapping lottery sign-ups in every year, including 2026. Real participant counts are somewhat higher than shown and win rates somewhat lower, least so for Ropecon 2026.",
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
        "Tabletop RPGs at this event use direct sign-up, not lottery.",
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
