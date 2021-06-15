import { ListElement } from 'eventassigner-random/lib/typings/list';

export interface Group {
  id: id; // Group id
  size: number; // Group size
  pref: id[]; // Game wishes (game id)
}

export interface Event {
  id: id; // game id
  min: number; // game min players
  max: number; // game max players
  groups: readonly Group[]; // groups signed for the game
}

export interface randomAssignEvent {
  id: id;
  min: number;
  max: number;
  groups: id[];
}

export interface ListItem {
  id: id; // group id
  size: number; // group size
  event: id; // game id for the signed game
  gain: number; // preference: 1st choice => 1, 2nd choice => 0.5, 3rd choice => 0.33
}

export interface RandomAssignUpdateLInput {
  groups: Group[];
  events: randomAssignEvent[];
  assignment: PadgRandomAssignResult[];
  unassignedGroups: Group[];
  L: ListElement[];
  groupId: id;
}

export interface PadgInput {
  groups: readonly Group[];
  events: readonly Event[];
  list: readonly ListItem[];
  updateL: () => void;
}

interface PadgRandomAssignResult {
  id: id; // group id
  assignment: id; // assigned game id
}

type id = string | number;

export type PadgRandomAssignResults = readonly PadgRandomAssignResult[];
