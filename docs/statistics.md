# Konsti Statistics

Aggregated statistics derived from past-event database dumps in [`server/src/features/statistics/datafiles/`](../server/src/features/statistics/datafiles/). See the [Datafiles Guide](en/datafiles-guide.md) for the file formats.

## Available statistics

- [Number of RPGs per event](statistics/rpg-counts.md) — Yearly RPG program counts per event, with year-over-year deltas.
- [How many RPGs started at each timeslot](statistics/rpg-start-times.md) — How many tabletop RPGs started each hour, broken down by day and event.
- [Lottery results](statistics/lottery-signups.md) — How many distinct users participated in the lottery vs how many got a seat.
- [Number of role-players](statistics/rpg-players.md) — Distinct users who engaged with RPGs (lottery or direct signup), regardless of whether they got a seat.
- [RPG seats filled](statistics/rpg-fill-rate.md) — How completely RPG seats were filled (lottery + direct combined) per event and year.
