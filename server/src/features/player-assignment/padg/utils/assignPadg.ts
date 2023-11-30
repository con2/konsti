import eventassigner from "eventassigner-js";
import { cloneDeep, sortBy } from "lodash-es";
import {
  PadgInput,
  ListItem,
  Group,
  Event,
  PadgRandomAssignResults,
  PadgError,
} from "server/types/padgRandomAssignTypes";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { calculateHappiness } from "server/features/player-assignment/padg/utils/calculateHappiness";
import { Input } from "server/types/resultTypes";

export const assignPadg = (
  groups: Group[],
  events: Event[],
  list: ListItem[],
  updateL: (input: Input) => string,
): PadgRandomAssignResults => {
  const { PADG_ASSIGNMENT_ROUNDS } = config.server();

  let finalHappiness = 0;
  let finalAssignResults: PadgRandomAssignResults = [];

  for (let i = 0; i < PADG_ASSIGNMENT_ROUNDS; i++) {
    const eventsCopy = cloneDeep(events);

    const input: PadgInput = {
      groups,
      events: eventsCopy,
      list: sortList(list, i),
      updateL,
    };

    const assignResults: PadgRandomAssignResults | PadgError =
      eventassigner.eventAssignment(input);

    // Skip error results
    if (!Array.isArray(assignResults)) {
      continue;
    }

    const happiness = calculateHappiness(assignResults, groups);

    if (happiness > finalHappiness) {
      finalHappiness = happiness;
      finalAssignResults = assignResults;
    }
  }

  logger.debug(`Padg assignment completed with happiness ${finalHappiness}%`);

  return finalAssignResults;
};

const sortList = (list: ListItem[], i: number): ListItem[] => {
  switch (i) {
    case 0:
      return sortBy(list, "gain");
    case 1:
      return sortBy(list, "size");
    default:
      return list.sort((_a, _b) => 0.5 - Math.random());
  }
};
