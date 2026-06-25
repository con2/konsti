import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import {
  bucketByHour,
  dayOfWeek,
  EVENT_LABELS,
  EVENT_ORDER,
  eventYears,
  readDataFile,
  writeDoc,
} from "server/features/statistics/doc-generators/helpers";

export const genRpgStartTimes = (): void => {
  const out: string[] = [
    "# How many RPGs started at each timeslot",
    "",
    "Counts of accepted (non-cancelled) tabletop RPGs grouped by start hour, by day, by event. Times are in Europe/Helsinki local time.",
    "",
    "Legend: each `█` = 1 RPG. Hours with zero count are omitted.",
    "",
  ];

  for (const event of EVENT_ORDER) {
    const years = eventYears(event);
    if (years.length === 0) continue;
    out.push(`## ${EVENT_LABELS[event] ?? event}`, "");

    for (const year of years) {
      const items = readDataFile(
        event,
        year,
        "program-items.json",
      ) as ProgramItem[];
      const rpgs = items.filter(
        (i) =>
          i.programType === ProgramType.TABLETOP_RPG &&
          i.state !== State.CANCELLED,
      );
      if (rpgs.length === 0) {
        out.push(
          `### ${year}`,
          "",
          "No tabletop RPGs in this event (different program types only).",
          "",
        );
        continue;
      }

      const byDayHour = new Map<string, Map<number, number>>();
      for (const item of rpgs) {
        const { day, hour } = bucketByHour(item.startTime);
        let hours = byDayHour.get(day);
        if (!hours) {
          hours = new Map();
          byDayHour.set(day, hours);
        }
        hours.set(hour, (hours.get(hour) ?? 0) + 1);
      }

      out.push(`### ${year} (${rpgs.length} total)`, "");

      const days = [...byDayHour.keys()].toSorted((a, b) => a.localeCompare(b));
      for (const day of days) {
        const hours = byDayHour.get(day);
        if (!hours) continue;
        const total = [...hours.values()].reduce((a, b) => a + b, 0);
        const block: string[] = [
          "```",
          `${day} (${dayOfWeek(day)}, ${total} total)`,
          "",
        ];
        const sortedHours = [...hours].toSorted((a, b) => a[0] - b[0]);
        for (const [h, c] of sortedHours) {
          const label = `${String(h).padStart(2, "0")}:00`;
          const bar = "█".repeat(c);
          block.push(`${label} │ ${bar} ${c}`);
        }
        block.push("```", "");
        out.push(...block);
      }
    }
  }

  out.push(
    "## Notes",
    "",
    "- Cancelled items (`state: 'cancelled'`) excluded.",
    "- Ropecon 2021 was a remote / COVID-era convention with smaller number of program items.",
    "",
  );

  writeDoc("rpg-start-times.md", out.join("\n"));
};
