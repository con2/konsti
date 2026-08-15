import { User } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  EVENT_LABELS,
  EVENT_ORDER,
  collectRpgLotteryParticipation,
  collectRpgSpotCounts,
  dataFileExists,
  eventYears,
  pct,
  readDataFile,
  scaleNote,
  writeDoc,
} from "server/features/statistics/doc-generators/statsUtils";

interface PlayerRow {
  event: string;
  year: string;
  participants: number;
  withSpot: number;
  spots: number;
  totalUsers: number;
}

export const genRpgPlayers = (): void => {
  const rows: PlayerRow[] = [];
  for (const event of EVENT_ORDER) {
    for (const year of eventYears(event)) {
      const { rpgIds, wonSlotsByUser, groupMemberSlotsByUser } =
        collectRpgLotteryParticipation(event, year);
      if (rpgIds.size === 0) continue;

      const users = readDataFile(event, year, "users.json") as User[];
      const ds = dataFileExists(event, year, "direct-signups.json")
        ? (readDataFile(
            event,
            year,
            "direct-signups.json",
          ) as DirectSignupsForProgramItem[])
        : [];

      const allParticipants = new Set<string>();
      const playersWithSpot = new Set<string>();
      for (const u of users) {
        for (const ls of u.lotterySignups) {
          if (rpgIds.has(ls.programItemId)) allParticipants.add(u.username);
        }
      }
      for (const e of ds) {
        if (!rpgIds.has(e.programItemId)) continue;
        for (const u of e.userSignups) {
          allParticipants.add(u.username);
          playersWithSpot.add(u.username);
        }
      }
      // Group members and lottery winners can be missing from users.json and
      // the final sign-ups; every winner got a spot even if they later gave it
      // up, and the assignment results are complete where the final sign-up
      // data can be lossy
      for (const username of wonSlotsByUser.keys()) {
        allParticipants.add(username);
        playersWithSpot.add(username);
      }
      for (const username of groupMemberSlotsByUser.keys()) {
        allParticipants.add(username);
      }

      const { spotsByItem } = collectRpgSpotCounts(event, year);
      const totalSpots = [...spotsByItem.values()].reduce((s, c) => s + c, 0);

      rows.push({
        event,
        year,
        participants: allParticipants.size,
        withSpot: playersWithSpot.size,
        spots: totalSpots,
        totalUsers: users.length,
      });
    }
  }

  const grandParticipants = rows.reduce((s, r) => s + r.participants, 0);
  const grandWithSpot = rows.reduce((s, r) => s + r.withSpot, 0);
  const grandSpots = rows.reduce((s, r) => s + r.spots, 0);

  const out: string[] = [
    "# Number of RPG players",
    "",
    "Distinct users who engaged with tabletop RPGs at each event: submitted a lottery sign-up, entered the lottery as a group member, or direct-signed up to an RPG - with or without ending up with a spot. Each user counts once per event.",
    "",
    "In each row, `got a spot` = players who got at least one RPG spot, `spots` = total RPG spots filled (a user playing two RPGs counts twice), and the last percentage compares players against all registered Konsti accounts for that event. Group members are counted from the group compositions stored with the lottery results - live records from Ropecon 2026 onward, backfilled from the event's final state for older events, so older years are slightly undercounted.",
    "",
    `**Across all events combined**: **${grandParticipants}** players summed over all event years (each unique user counted once per event), of which **${grandWithSpot}** got at least one spot (${pct(grandWithSpot, grandParticipants)}). Total RPG spots filled: **${grandSpots}**.`,
    "",
  ];

  for (const event of EVENT_ORDER) {
    const items = rows.filter((r) => r.event === event);
    if (items.length === 0) continue;
    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");

    const max = Math.max(...items.map((r) => r.participants));
    const scale = Math.max(1, Math.ceil(max / 40));

    const block: string[] = ["```"];
    for (const r of items) {
      const bars = Math.max(1, Math.round(r.participants / scale));
      const bar = "█".repeat(bars);
      block.push(
        `${r.year} ${bar} ${r.participants} players · ${r.withSpot} got a spot (${pct(r.withSpot, r.participants)}) · ${r.spots} spots · ${pct(r.participants, r.totalUsers)} of Konsti users`,
      );
    }
    block.push("", scaleNote(scale, "player", "players"), "```", "");
    out.push(...block);
  }

  out.push(
    "## Notes",
    "",
    "- Programs cancelled after their lottery ran are included in participation and wins; they add no spots because their sign-up lists were emptied on cancellation.",
    "- Players with a spot include lottery winners from the assignment results even when their spot is missing from the final sign-up data. Tracon Hitpoint 2019 spot totals also come from the assignment results, because its final sign-up data only kept each user's last lottery win (see the [datafiles guide](../en/datafiles-guide.md)).",
    "- Solmukohta 2024 hosted no tabletop RPGs (larps, workshops, and roundtable discussions only).",
    "- Ropecon 2021 was a remote / COVID-era convention with direct sign-up only - no lottery, so every counted player also got a spot there.",
    "- Tracon (2024 / 2025) used direct sign-up only for RPGs - same equality holds. Konsti covered only a small part of the Tracon program, which is why the share of Konsti users is low.",
    "",
  );

  writeDoc("rpg-players.md", out.join("\n"));
};
