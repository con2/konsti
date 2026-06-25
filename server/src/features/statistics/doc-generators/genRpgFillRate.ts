import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  fixedBar,
  pct,
  readDataFile,
  writeDoc,
} from "server/features/statistics/doc-generators/helpers";

interface FillRow {
  event: string;
  year: string;
  avail: number;
  filled: number;
  full: number;
  empty: number;
  progs: number;
  noLimit: number;
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
      const rpgs = items.filter(
        (i) =>
          i.programType === ProgramType.TABLETOP_RPG &&
          i.state !== State.CANCELLED &&
          i.maxAttendance > 0,
      );
      const noLimit = items.filter(
        (i) =>
          i.programType === ProgramType.TABLETOP_RPG &&
          i.state !== State.CANCELLED &&
          i.maxAttendance === 0,
      ).length;
      if (rpgs.length === 0) continue;

      const ds = readDataFile(
        event,
        year,
        "direct-signups.json",
      ) as DirectSignupsForProgramItem[];
      const countById = new Map<string, number>();
      for (const e of ds) {
        countById.set(e.programItemId, e.count);
      }

      let avail = 0;
      let filled = 0;
      let full = 0;
      let empty = 0;
      for (const r of rpgs) {
        avail += r.maxAttendance;
        const c = countById.get(r.programItemId) ?? 0;
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
        progs: rpgs.length,
        noLimit,
      });
    }
  }

  const totalAvail = rows.reduce((s, r) => s + r.avail, 0);
  const totalFilled = rows.reduce((s, r) => s + r.filled, 0);

  const out: string[] = [
    "# RPG seats filled",
    "",
    "How completely tabletop-RPG seats were filled at each event. Combines lottery-assigned and direct signups.",
    "",
    "Programs with `maxAttendance: 0` (no limit) are excluded from the rate but counted separately.",
    "",
    `**Across all events combined**: **${totalFilled} / ${totalAvail}** seats filled (${pct(totalFilled, totalAvail)}).`,
    "",
  ];

  for (const event of EVENT_ORDER) {
    const items = rows.filter((r) => r.event === event);
    if (items.length === 0) continue;
    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");
    const block: string[] = ["```"];
    for (const r of items) {
      const pctStr = pct(r.filled, r.avail).padStart(6);
      const noLimitStr = r.noLimit > 0 ? ` · ${r.noLimit} no-limit` : "";
      block.push(
        `${r.year} ${fixedBar(r.filled, r.avail, 35)} ${pctStr}  ${r.filled} / ${r.avail} seats  ·  ${r.full} full / ${r.empty} empty / ${r.progs} programs${noLimitStr}`,
      );
    }
    block.push("```", "");
    out.push(...block);
  }

  if (rows.every((r) => r.event !== "solmukohta")) {
    out.push("## Solmukohta", "", "No tabletop RPGs at this event.", "");
  }

  out.push(
    "## Notes",
    "",
    '- Cancelled programs (`state: "cancelled"`) are excluded.',
    "",
  );

  writeDoc("rpg-fill-rate.md", out.join("\n"));
};
