import {
  ProgramItem,
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";
import {
  collectRpgSpotCounts,
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  fixedBar,
  NO_RPGS_TEXT,
  pct,
  readDataFile,
  writeDoc,
} from "server/features/statistics/doc-generators/statsUtils";

interface FillRow {
  event: string;
  year: string;
  avail: number;
  filled: number;
  full: number;
  empty: number;
  progs: number;
  nonKonsti: number;
}

export const genRpgFillRate = (): void => {
  const rows: FillRow[] = [];
  for (const event of EVENT_ORDER) {
    for (const year of eventYears(event)) {
      const items = readDataFile(
        event,
        year,
        "program-items.json",
      ) as ProgramItem[];
      const allRpgs = items.filter(
        (i) =>
          i.programType === ProgramType.TABLETOP_RPG &&
          i.state !== State.CANCELLED,
      );
      // Items not signed up via Konsti can have no Konsti sign-ups, so
      // counting them would read as empty spots
      const nonKonsti = allRpgs.filter(
        (i) => i.signupType !== SignupType.KONSTI,
      ).length;
      const { konstiRpgs, spotsByItem } = collectRpgSpotCounts(event, year);
      if (konstiRpgs.length === 0 && nonKonsti === 0) continue;

      let avail = 0;
      let filled = 0;
      let full = 0;
      let empty = 0;
      for (const r of konstiRpgs) {
        avail += r.maxAttendance;
        const c = spotsByItem.get(r.programItemId) ?? 0;
        filled += c;
        if (c >= r.maxAttendance) full++;
        if (c === 0) empty++;
      }
      rows.push({
        event,
        year,
        avail,
        filled,
        full,
        empty,
        progs: konstiRpgs.length,
        nonKonsti,
      });
    }
  }

  const totalAvail = rows.reduce((s, r) => s + r.avail, 0);
  const totalFilled = rows.reduce((s, r) => s + r.filled, 0);

  const out: string[] = [
    "# RPG spots filled",
    "",
    "How completely tabletop RPG spots were filled at each event, combining lottery-assigned and direct sign-ups.",
    "",
    "In each bar, `█` = filled spots and `▄` = unfilled spots. After the bar, `full` = programs whose sign-ups reached their attendance limit, `empty` = programs with no sign-ups at all.",
    "",
    "Excluded from the rate but counted separately per row: programs not signed up via Konsti (`non-Konsti`: RPGs listed in Konsti without Konsti sign-up, such as drop-in and externally organized games).",
    "",
    `**Across all events combined**: **${totalFilled} / ${totalAvail}** spots filled (${pct(totalFilled, totalAvail)}).`,
    "",
  ];

  for (const event of EVENT_ORDER) {
    const items = rows.filter((r) => r.event === event);
    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");
    if (items.length === 0) {
      out.push(NO_RPGS_TEXT, "");
      continue;
    }
    const block: string[] = ["```"];
    for (const r of items) {
      const pctStr = pct(r.filled, r.avail).padStart(6);
      const nonKonstiStr =
        r.nonKonsti > 0 ? ` · ${r.nonKonsti} non-Konsti` : "";
      block.push(
        `${r.year} ${fixedBar(r.filled, r.avail, 35)} ${pctStr}  ${r.filled} / ${r.avail} spots  ·  ${r.full} full / ${r.empty} empty / ${r.progs} programs${nonKonstiStr}`,
      );
    }
    block.push("```", "");
    out.push(...block);
  }

  out.push(
    "## Notes",
    "",
    '- Cancelled programs (`state: "cancelled"`) are excluded.',
    "- Tracon Hitpoint 2019 spot counts come from the assignment results: the final sign-up data at that event only kept each user's last lottery win, which would understate the year by about a third (see the [datafiles guide](../en/datafiles-guide.md)). Results count assigned spots, so a few spots users gave up afterwards are included.",
    "- A few historical programs are overfilled (sign-ups above `maxAttendance`, 11 in total across 2017-2025), so `filled` can slightly exceed capacity.",
    "",
  );

  writeDoc("rpg-fill-rate.md", out.join("\n"));
};
