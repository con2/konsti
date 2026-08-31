import { EventConfig } from "shared/config/eventConfigTypes";
import { eventConfig as hitpoint2019 } from "shared/config/past-events/hitpoint2019";
import { eventConfig as hitpoint2023 } from "shared/config/past-events/hitpoint2023";
import { eventConfig as hitpoint2024 } from "shared/config/past-events/hitpoint2024";
import { eventConfig as ropecon2017 } from "shared/config/past-events/ropecon2017";
import { eventConfig as ropecon2018 } from "shared/config/past-events/ropecon2018";
import { eventConfig as ropecon2019 } from "shared/config/past-events/ropecon2019";
import { eventConfig as ropecon2021 } from "shared/config/past-events/ropecon2021";
import { eventConfig as ropecon2022 } from "shared/config/past-events/ropecon2022";
import { eventConfig as ropecon2023 } from "shared/config/past-events/ropecon2023";
import { eventConfig as ropecon2024 } from "shared/config/past-events/ropecon2024";
import { eventConfig as ropecon2025 } from "shared/config/past-events/ropecon2025";
import { eventConfig as ropecon2026 } from "shared/config/past-events/ropecon2026";
import { eventConfig as solmukohta2024 } from "shared/config/past-events/solmukohta2024";
import { eventConfig as tracon2024 } from "shared/config/past-events/tracon2024";
import { eventConfig as tracon2025 } from "shared/config/past-events/tracon2025";

export interface PastEvent {
  // The datafile directory the event's dump lives in, which is not always the event
  // name: Tracon Hitpoint's dumps sit under "tracon-hitpoint" while its config calls
  // the event "Tracon Hitpoint"
  datafileDir: string;
  year: string;
  eventConfig: Partial<EventConfig>;
}

// Ordered oldest first so a replay of every event runs in chronological order
export const pastEvents: readonly PastEvent[] = [
  { datafileDir: "ropecon", year: "2017", eventConfig: ropecon2017 },
  { datafileDir: "ropecon", year: "2018", eventConfig: ropecon2018 },
  { datafileDir: "ropecon", year: "2019", eventConfig: ropecon2019 },
  { datafileDir: "tracon-hitpoint", year: "2019", eventConfig: hitpoint2019 },
  { datafileDir: "ropecon", year: "2021", eventConfig: ropecon2021 },
  { datafileDir: "ropecon", year: "2022", eventConfig: ropecon2022 },
  { datafileDir: "ropecon", year: "2023", eventConfig: ropecon2023 },
  { datafileDir: "tracon-hitpoint", year: "2023", eventConfig: hitpoint2023 },
  { datafileDir: "ropecon", year: "2024", eventConfig: ropecon2024 },
  { datafileDir: "tracon", year: "2024", eventConfig: tracon2024 },
  { datafileDir: "tracon-hitpoint", year: "2024", eventConfig: hitpoint2024 },
  { datafileDir: "solmukohta", year: "2024", eventConfig: solmukohta2024 },
  { datafileDir: "ropecon", year: "2025", eventConfig: ropecon2025 },
  { datafileDir: "tracon", year: "2025", eventConfig: tracon2025 },
  { datafileDir: "ropecon", year: "2026", eventConfig: ropecon2026 },
];

// What `--event` takes, which is the dump's location rather than the event's name
export const getPastEventKey = ({ datafileDir, year }: PastEvent): string =>
  `${datafileDir}/${year}`;

// What the event is called. The reconstructed configs all carry a name, so the fallback is
// only there because the type cannot say so.
export const getPastEventName = (pastEvent: PastEvent): string =>
  `${pastEvent.eventConfig.eventName ?? pastEvent.datafileDir} ${pastEvent.year}`;

export const findPastEvent = (key: string): PastEvent | undefined =>
  pastEvents.find((pastEvent) => getPastEventKey(pastEvent) === key);
