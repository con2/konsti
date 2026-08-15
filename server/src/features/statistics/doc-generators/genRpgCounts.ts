import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import {
  EVENT_LABELS,
  EVENT_ORDER,
  NO_RPGS_TEXT,
  eventYears,
  readDataFile,
  scaleNote,
  writeDoc,
} from "server/features/statistics/doc-generators/statsUtils";

export const genRpgCounts = (): void => {
  const rows: { event: string; year: string; rpgs: number }[] = [];
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
          i.state !== State.CANCELLED,
      ).length;
      rows.push({ event, year, rpgs });
    }
  }

  const total = rows.reduce((s, r) => s + r.rpgs, 0);
  const yearsWithRpgs = rows.filter((r) => r.rpgs > 0).length;

  const out: string[] = [
    "# Number of RPGs per event",
    "",
    "How many tabletop RPG programs were run at each event. Counts non-cancelled `tabletopRPG` items in `program-items.json`.",
    "",
    "Bars are scaled per event section (see the scale note under each chart), so bar lengths are not comparable between sections.",
    "",
    `**Across all events combined**: **${total}** RPG programs run over ${yearsWithRpgs} event years.`,
    "",
  ];

  for (const event of EVENT_ORDER) {
    const items = rows.filter((r) => r.event === event);
    if (items.length === 0) continue;
    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");

    const withRpgs = items.filter((r) => r.rpgs > 0);
    if (withRpgs.length === 0) {
      out.push(NO_RPGS_TEXT, "");
      continue;
    }

    const max = Math.max(...withRpgs.map((r) => r.rpgs));
    const scale = Math.max(1, Math.ceil(max / 50));

    const eventBlock: string[] = ["```"];
    let prev: { year: string; rpgs: number } | null = null;
    for (const r of items) {
      if (r.rpgs === 0) {
        eventBlock.push(`${r.year} (no RPGs)`);
        prev = null;
        continue;
      }
      const bars = Math.max(1, Math.round(r.rpgs / scale));
      const bar = "█".repeat(bars);
      const delta = prev
        ? ` (${r.rpgs >= prev.rpgs ? "+" : ""}${r.rpgs - prev.rpgs} vs ${prev.year})`
        : "";
      eventBlock.push(`${r.year} ${bar} ${r.rpgs}${delta}`);
      prev = { year: r.year, rpgs: r.rpgs };
    }
    eventBlock.push("", scaleNote(scale, "RPG", "RPGs"), "```", "");
    out.push(...eventBlock);
  }

  out.push(
    "## Notes",
    "",
    '- Cancelled programs (`state: "cancelled"`) are excluded - these are programs that were imported but never ran.',
    "- Ropecon 2021 was a remote / COVID-era convention with a much smaller program.",
    "",
  );

  writeDoc("rpg-counts.md", out.join("\n"));
};
