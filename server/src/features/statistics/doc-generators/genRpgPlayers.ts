import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  dataFileExists,
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  pct,
  readDataFile,
  writeDoc,
} from "server/features/statistics/doc-generators/helpers";

interface PlayerRow {
  event: string;
  year: string;
  participants: number;
  seated: number;
  seats: number;
  totalUsers: number;
  rpgs: number;
}

export const genRpgPlayers = (): void => {
  const rows: PlayerRow[] = [];
  for (const event of EVENT_ORDER) {
    for (const year of eventYears(event)) {
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
      const seatedPlayers = new Set<string>();
      let totalSeats = 0;
      for (const u of users) {
        for (const ls of u.lotterySignups) {
          if (rpgIds.has(ls.programItemId)) allParticipants.add(u.username);
        }
      }
      for (const e of ds) {
        if (!rpgIds.has(e.programItemId)) continue;
        for (const u of e.userSignups) {
          allParticipants.add(u.username);
          seatedPlayers.add(u.username);
          totalSeats++;
        }
      }

      rows.push({
        event,
        year,
        participants: allParticipants.size,
        seated: seatedPlayers.size,
        seats: totalSeats,
        totalUsers: users.length,
        rpgs: rpgIds.size,
      });
    }
  }

  const grandParticipants = rows.reduce((s, r) => s + r.participants, 0);
  const grandSeated = rows.reduce((s, r) => s + r.seated, 0);
  const grandSeats = rows.reduce((s, r) => s + r.seats, 0);

  const out: string[] = [
    "# Number of role-players",
    "",
    "Distinct users who engaged with tabletop RPGs at each event — either by submitting a lottery signup or by direct-signing up to an RPG, regardless of whether they ended up with a seat. Each user counts once per event.",
    "",
    `**Across all events combined**: **${grandParticipants}** distinct role-player slots (counting each unique user once per event), of which **${grandSeated}** got at least one seat (${pct(grandSeated, grandParticipants)}). Total RPG seat assignments: **${grandSeats}**.`,
    "",
  ];

  for (const event of EVENT_ORDER) {
    const items = rows.filter((r) => r.event === event);
    if (items.length === 0) continue;
    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");

    const max = Math.max(...items.map((r) => r.participants));
    const scale = Math.max(1, Math.ceil(max / 50));

    const block: string[] = ["```"];
    for (const r of items) {
      const bars = Math.max(1, Math.round(r.participants / scale));
      const bar = "█".repeat(bars);
      block.push(
        `${r.year} ${bar} ${r.participants} role-players · ${r.seated} got a seat (${pct(r.seated, r.participants)}) · ${r.seats} RPG seats filled · ${pct(r.participants, r.totalUsers)} of all event users`,
      );
    }
    if (scale > 1) {
      block.push("", `(scale: 1 block ≈ ${scale} role-players)`);
    }
    block.push("```", "");
    out.push(...block);
  }

  out.push(
    "## Notes",
    "",
    "- Solmukohta 2024 hosted no tabletop RPGs (only larps and workshops).",
    "- Ropecon 2021 was a remote / COVID-era convention with direct signup only — no lottery, so role-player count equals seated count there.",
    "- Tracon (2024 / 2025) used direct signup only for RPGs — same equality holds.",
    "",
  );

  writeDoc("rpg-players.md", out.join("\n"));
};
