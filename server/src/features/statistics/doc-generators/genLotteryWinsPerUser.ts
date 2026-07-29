import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  collectRpgLotteryParticipation,
  dataFileExists,
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  pct,
  readDataFile,
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
        // every program type, so a year where the lottery filled all RPG seats
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
    return [`### ${dist.year}`, "", "No tabletop RPGs in this event.", ""];
  }
  if (dist.kind === "no-lottery") {
    return [
      `### ${dist.year}`,
      "",
      "Tabletop RPGs at this event use direct sign-up, not lottery.",
      "",
    ];
  }

  const winCounts = [...dist.usersByWinCount.keys()].toSorted((a, b) => a - b);
  const winners = [...dist.usersByWinCount.values()].reduce(
    (sum, n) => sum + n,
    0,
  );
  const totalParticipants = winners + dist.zeroWins;
  const maxUsers = Math.max(dist.zeroWins, ...dist.usersByWinCount.values());
  const scale = Math.max(1, Math.ceil(maxUsers / 40));

  const zeroBar = "█".repeat(Math.round(dist.zeroWins / scale));
  const zeroSep = zeroBar.length > 0 ? `${zeroBar} ` : "";
  const out: string[] = [
    `### ${dist.year}`,
    "",
    `**Lottery wins (${totalParticipants} participants, ${winners} won at least one seat):**`,
    "",
    "```",
    `0 seats │ ${zeroSep}${dist.zeroWins} (${pct(dist.zeroWins, totalParticipants)})`,
  ];
  for (const wins of winCounts) {
    const users = dist.usersByWinCount.get(wins) ?? 0;
    const bar = "█".repeat(Math.round(users / scale));
    const label = `${wins} ${wins === 1 ? "seat " : "seats"}`;
    const sep = bar.length > 0 ? `${bar} ` : "";
    out.push(`${label} │ ${sep}${users} (${pct(users, totalParticipants)})`);
  }
  if (scale > 1) {
    out.push("", `(scale: 1 block ≈ ${scale} users)`);
  }
  out.push("```", "");

  // Total games only makes sense once the direct sign-up phase exists:
  // without it the final data adds nothing over the lottery results
  if (!dist.hasDirectSignup) {
    out.push(
      "This event had no direct sign-up - the lottery was the only way in.",
      "",
    );
    return out;
  }

  const gameCounts = [...dist.usersByGameCount.keys()].toSorted(
    (a, b) => a - b,
  );
  const maxGameUsers = Math.max(...dist.usersByGameCount.values());
  const gamesScale = Math.max(1, Math.ceil(maxGameUsers / 40));
  out.push(
    "**Total games played (kept lottery seats + direct sign-ups):**",
    "",
    "```",
  );
  for (const games of gameCounts) {
    const users = dist.usersByGameCount.get(games) ?? 0;
    const bar = "█".repeat(Math.round(users / gamesScale));
    const label = `${games} ${games === 1 ? "game " : "games"}`;
    const sep = bar.length > 0 ? `${bar} ` : "";
    out.push(`${label} │ ${sep}${users} (${pct(users, totalParticipants)})`);
  }
  if (gamesScale > 1) {
    out.push("", `(scale: 1 block ≈ ${gamesScale} users)`);
  }
  out.push("```", "");

  const sentences: string[] = [];
  if (dist.zeroWins > 0) {
    sentences.push(
      `Of the ${dist.zeroWins} participants without a lottery win, ${dist.zeroWinsWithDirect} (${pct(dist.zeroWinsWithDirect, dist.zeroWins)}) still played at least one RPG via direct sign-up.`,
    );
  } else {
    sentences.push("Every participant won at least one seat.");
  }
  if (winners > 0) {
    sentences.push(
      `${dist.winnersWithZeroGames} ${dist.winnersWithZeroGames === 1 ? "winner" : "winners"} (${pct(dist.winnersWithZeroGames, winners)}) kept none of their won seats.`,
    );
  }
  out.push(sentences.join(" "), "");
  return out;
};

export const genLotteryWinsPerUser = (): void => {
  const out: string[] = [
    "# Lottery wins and games played per user",
    "",
    "How many tabletop-RPG seats a single user received from the lottery algorithm, per event and year: for each number of won seats, how many users the algorithm gave exactly that many. The `0 seats` row is lottery participants who won nothing; each year also notes how many of them still got into an RPG via direct sign-up.",
    "",
    "Wins are counted from the lottery assignment results to measure algorithm performance - a seat counts even if the user later cancelled it, and each start time counts once per user across re-runs. Participants are users with at least one RPG lottery sign-up, plus all winners (a group member's own sign-ups may be missing from the data, see caveat).",
    "",
    "Years with a direct sign-up phase have a second chart with the total number of games the same participants ended up playing: seats still held in the final data, whether won in the lottery or grabbed via direct sign-up, so cancelled lottery seats don't count.",
    "",
    "**Caveat:** some losing participants are missing from the data, so the real `0 seats` counts are somewhat higher than shown. Joining a group deleted the user's own lottery sign-ups in dumps before Ropecon 2026 (2017-2018 were restored from old result snapshots), the group records of older events were backfilled from the event's final state (missing anyone who left a group before the end), and winning a seat removes the user's overlapping lottery sign-ups in every year, including 2026. Ropecon 2026 records group compositions live, making it the most complete year, but not a perfect one.",
    "",
  ];

  for (const event of EVENT_ORDER) {
    const distributions = Array.from(eventYears(event), (year) =>
      collectDistribution(event, year),
    );
    if (distributions.length === 0) continue;

    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");
    if (distributions.every((d) => d.kind === "no-rpgs")) {
      out.push("No tabletop RPGs at this event.", "");
      continue;
    }
    if (distributions.every((d) => d.kind !== "ok")) {
      out.push(
        "Tabletop RPGs at this event use direct sign-up, not lottery.",
        "",
      );
      continue;
    }

    for (const d of distributions) {
      out.push(...renderYearSection(d));
    }
  }

  out.push(
    "## Notes",
    "",
    '- Cancelled programs (`state: "cancelled"`) are excluded.',
    "",
  );

  writeDoc("lottery-wins-per-user.md", out.join("\n"));
};
