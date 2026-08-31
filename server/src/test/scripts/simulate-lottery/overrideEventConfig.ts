import { config } from "shared/config";
import { EventConfig } from "shared/config/eventConfigTypes";

// Every key that changes what the lottery does. A past event omitting one of these falls
// through to the current event's value, which silently replays somebody else's rules - so the
// caller is handed the list and reports it.
const lotteryRelevantKeys: readonly (keyof EventConfig)[] = [
  "assignmentAlgorithm",
  "enableGroups",
  "eventStartTime",
  "directSignupPhaseStart",
  "preSignupStart",
  "phaseGap",
  "directSignupAlwaysOpenIds",
  "twoPhaseSignupProgramTypes",
  "activeProgramTypes",
  "removeLotterySignupsStrategy",
  "fixedLotterySignupTime",
  "startTimesByParentIds",
  "preConventionWeekSignupStartTime",
];

// Two keys name program items, so the current event's values match nothing in a past
// programme - except by accident, which is the whole problem. A config that predates the
// feature meant "this event has none", so that is what it gets rather than the fallback.
const absentByDefault: Partial<EventConfig> = {
  startTimesByParentIds: new Map(),
  preConventionWeekSignupStartTime: null,
  directSignupAlwaysOpenIds: [],
};

// The non-vitest counterpart of setupTests.ts's `vi.spyOn(config, "event")`. `config` is a
// plain object of getters, so replacing one is enough and no production file gains a hook.
export const overrideEventConfig = (
  pastEventConfig: Partial<EventConfig>,
): readonly (keyof EventConfig)[] => {
  const neutralized = Object.fromEntries(
    Object.entries(absentByDefault).filter(
      ([key]) => !(key in pastEventConfig),
    ),
  );
  const merged: EventConfig = {
    ...config.event(),
    ...neutralized,
    ...pastEventConfig,
  };
  config.event = (): EventConfig => merged;

  return lotteryRelevantKeys.filter(
    (key) => !(key in pastEventConfig) && !(key in absentByDefault),
  );
};
