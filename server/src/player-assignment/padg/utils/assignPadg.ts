import eventassigner from 'eventassigner-js';
import _ from 'lodash';
import { logger } from 'utils/logger';
import { config } from 'config';
import { calculateHappiness } from 'player-assignment/padg/utils/calculateHappiness';
import {
  Input,
  ListItem,
  Group,
  Event,
  PadgAssignResults,
} from 'typings/padgAssign.typings';

export const assignPadg = (
  groups: Group[],
  events: Event[],
  list: ListItem[],
  updateL: Function
): PadgAssignResults => {
  const { PADG_ASSIGNMENT_ROUNDS } = config;

  let finalHappiness = 0;
  let finalAssignResults: PadgAssignResults = [];

  const sortList = (list: ListItem[], i: number): ListItem[] => {
    switch (i) {
      case 0:
        return _.sortBy(list, 'gain');
      case 1:
        return _.sortBy(list, 'size');
      default:
        return list.sort((a, b) => 0.5 - Math.random());
    }
  };

  for (let i = 0; i < PADG_ASSIGNMENT_ROUNDS; i++) {
    const eventsCopy = _.cloneDeep(events);

    const input: Input = {
      groups,
      events: eventsCopy,
      list: sortList(list, i),
      updateL,
    };

    const assignResults: PadgAssignResults = eventassigner.eventAssignment(
      input
    );

    const happiness = calculateHappiness(assignResults, groups);

    if (happiness > finalHappiness) {
      finalHappiness = happiness;
      finalAssignResults = assignResults;
    }
  }

  logger.debug(`Padg assignment completed with happiness ${finalHappiness}%`);

  return finalAssignResults;
};
