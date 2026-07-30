import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  collectRpgLotteryParticipation,
  dataFileExists,
  DIRECT_SIGNUP_ONLY_TEXT,
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  NO_RPGS_TEXT,
  pct,
  readDataFile,
  scaleNote,
  writeDoc,
} from "server/features/statistics/doc-generators/statsUtils";

type YearDistribution =
  | { year: string; kind: "no-rpgs" }
  | { year: string; kind: "no-lottery" }
  | {
      year: string;
      kind: "ok";
      usersByWinCount: Map<number, number>;
      usersByGameCount: Map<number, number>;
      zeroWins: number;
      zeroWinsWithDirect: number;
      winnersWithZeroGames: number;
      hasDirectSignup: boolean;
    };

const collectDistribution = (event: string, year: string): YearDistribution => {
  const { rpgIds, ownSlotsByUser, wonSlotsByUser, groupMemberSlotsByUser } =
    collectRpgLotteryParticipation(event, year);
  if (rpgIds.size === 0) return { year, kind: "no-rpgs" };

  const participants = new Set([
    ...ownSlotsByUser.keys(),
    ...groupMemberSlotsByUser.keys(),
  ]);
  if (participants.size === 0 && wonSlotsByUser.size === 0) {
    return { year, kind: "no-lottery" };
  }

  const ds = dataFileExists(event, year, "direct-signups.json")
    ? (readDataFile(
        event,
        year,
        "direct-signups.json",
      ) as DirectSignupsForProgramItem[])
    : [];
  const usersWithDirectSignup = new Set<string>();
  let anyDirectSignup = false;
  const gamesByUser = new Map<string, number>();
  for (const entry of ds) {
    for (const signup of entry.userSignups) {
      // priority 0 = first-come-first-served direct sign-up, 1-3 = lottery win
      if (signup.priority === 0) {
        // Whether the event ran a direct sign-up phase at all is judged across
        // every program type, so a year where the lottery filled all RPG spots
        // is not mistaken for a lottery-only event
        anyDirectSignup = true;
        if (rpgIds.has(entry.programItemId)) {
          usersWithDirectSignup.add(signup.username);
        }
      }
      if (rpgIds.has(entry.programItemId)) {
        gamesByUser.set(
          signup.username,
          (gamesByUser.get(signup.username) ?? 0) + 1,
        );
      }
    }
  }

  let zeroWins = 0;
  let zeroWinsWithDirect = 0;
  for (const username of participants) {
    if (wonSlotsByUser.has(username)) continue;
    zeroWins++;
    if (usersWithDirectSignup.has(username)) zeroWinsWithDirect++;
  }

  const usersByWinCount = new Map<number, number>();
  for (const slots of wonSlotsByUser.values()) {
    usersByWinCount.set(slots.size, (usersByWinCount.get(slots.size) ?? 0) + 1);
  }

  const usersByGameCount = new Map<number, number>();
  for (const username of new Set([...participants, ...wonSlotsByUser.keys()])) {
    const games = gamesByUser.get(username) ?? 0;
    usersByGameCount.set(games, (usersByGameCount.get(games) ?? 0) + 1);
  }

  let winnersWithZeroGames = 0;
  for (const username of wonSlotsByUser.keys()) {
    if ((gamesByUser.get(username) ?? 0) === 0) winnersWithZeroGames++;
  }

  return {
    year,
    kind: "ok",
    usersByWinCount,
    usersByGameCount,
    zeroWins,
    zeroWinsWithDirect,
    winnersWithZeroGames,
    hasDirectSignup: anyDirectSignup,
  };
};

const renderYearSection = (dist: YearDistribution): string[] => {
  if (dist.kind === "no-rpgs") {
    return [`### ${dist.year}`, "", NO_RPGS_TEXT, ""];
  }
  if (dist.kind === "no-lottery") {
    return [`### ${dist.year}`, "", DIRECT_SIGNUP_ONLY_TEXT, ""];
  }

  const winners = [...dist.usersByWinCount.values()].reduce(
    (sum, n) => sum + n,
    0,
  );
  const totalParticipants = winners + dist.zeroWins;
  // One scale for both charts: they describe the same users, so equal counts
  // must render equal bars
  const maxUsers = Math.max(
    dist.zeroWins,
    ...dist.usersByWinCount.values(),
    ...(dist.hasDirectSignup ? dist.usersByGameCount.values() : []),
  );
  const scale = Math.max(1, Math.ceil(maxUsers / 40));

  const chartRow = (label: string, users: number): string => {
    const bar = "█".repeat(Math.round(users / scale));
    const sep = bar.length > 0 ? `${bar} ` : "";
    return `${label} │ ${sep}${users} (${pct(users, totalParticipants)})`;
  };

  const maxWins = Math.max(0, ...dist.usersByWinCount.keys());
  const out: string[] = [
    `### ${dist.year}`,
    "",
    `**Lottery wins (${totalParticipants} participants, ${winners} won at least one spot):**`,
    "",
    "```",
    chartRow("0 spots", dist.zeroWins),
  ];
  for (let wins = 1; wins <= maxWins; wins++) {
    const label = `${wins} ${wins === 1 ? "spot " : "spots"}`;
    out.push(chartRow(label, dist.usersByWinCount.get(wins) ?? 0));
  }
  out.push("", scaleNote(scale, "user", "users"), "```", "");

  // Total games only makes sense once the direct sign-up phase exists:
  // without it the final data adds nothing over the lottery results
  if (!dist.hasDirectSignup) {
    out.push(
      "This event had no direct sign-up - the lottery was the only way in.",
      "",
    );
    return out;
  }

  const maxGames = Math.max(0, ...dist.usersByGameCount.keys());
  out.push(
    "**Total games played (kept lottery spots + direct sign-ups):**",
    "",
    "```",
  );
  for (let games = 0; games <= maxGames; games++) {
    const label = `${games} ${games === 1 ? "game " : "games"}`;
    out.push(chartRow(label, dist.usersByGameCount.get(games) ?? 0));
  }
  out.push("", scaleNote(scale, "user", "users"), "```", "");

  const sentences: string[] = [];
  if (dist.zeroWins > 0) {
    sentences.push(
      `Of the ${dist.zeroWins} participants without a lottery win, ${dist.zeroWinsWithDirect} (${pct(dist.zeroWinsWithDirect, dist.zeroWins)}) still played at least one RPG via direct sign-up.`,
    );
  } else {
    sentences.push("Every participant won at least one spot.");
  }
  if (winners > 0) {
    sentences.push(
      `${dist.winnersWithZeroGames} ${dist.winnersWithZeroGames === 1 ? "winner" : "winners"} (${pct(dist.winnersWithZeroGames, winners)}) ended up with none of their won spots, whether given up or cancelled.`,
    );
  }
  out.push(sentences.join(" "), "");
  return out;
};

export const genLotteryWinsPerUser = (): void => {
  const out: string[] = [
    "# Lottery wins and games played per user",
    "",
    "How many tabletop RPG spots the lottery gave each user, per event and year: each chart row shows how many users won exactly that many spots. The `0 spots` row is lottery participants who won nothing; years with a direct sign-up phase also note how many of them still got into an RPG via direct sign-up.",
    "",
    "Wins are counted from the lottery assignment results to measure algorithm performance: a spot counts even if the user later gave it up, and each lottery slot counts once per user. Wins on deleted program items cannot be counted (see Notes). Participants are users with at least one RPG lottery sign-up, plus all winners (a group member's own sign-ups may be missing from the data, see caveat).",
    "",
    "Years with a direct sign-up phase have a second chart with the total number of games the same users ended up playing: spots still held in the final data, whether won in the lottery or grabbed via direct sign-up - cancelled lottery spots don't count.",
    "",
    "**Caveat:** some losing participants are missing from the data, so the real `0 spots` counts are somewhat higher than shown (least so for Ropecon 2026, which records group compositions live):",
    "",
    "- Joining a group deleted the user's own sign-ups for upcoming program items in dumps before Ropecon 2026 (2017-2018 sign-ups were restored from old result snapshots).",
    "- The backfilled group records of older events reflect each group's final membership: anyone who left a group before the event ended is missed, and late joiners are counted for slots they never entered.",
    "- Program items moved or deleted after a lottery run erase the matching sign-ups, which can hide a losing group even in 2026 data.",
    "",
  ];

  for (const event of EVENT_ORDER) {
    const distributions = Array.from(eventYears(event), (year) =>
      collectDistribution(event, year),
    );
    if (distributions.length === 0) continue;

    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");
    if (distributions.every((d) => d.kind === "no-rpgs")) {
      out.push(NO_RPGS_TEXT, "");
      continue;
    }
    if (distributions.every((d) => d.kind !== "ok")) {
      out.push(DIRECT_SIGNUP_ONLY_TEXT, "");
      continue;
    }

    for (const d of distributions) {
      out.push(...renderYearSection(d));
    }
  }

  out.push(
    "## Notes",
    "",
    "- Programs cancelled after their lottery ran are included: their sign-ups and wins count even though the program never happened.",
    "- Wins on program items deleted from the data cannot be identified as RPGs and are not counted: 9 result rows in Tracon Hitpoint 2023, 6 in Tracon Hitpoint 2024, and 5 in Ropecon 2026.",
    "",
  );

  writeDoc("lottery-wins-per-user.md", out.join("\n"));
};
