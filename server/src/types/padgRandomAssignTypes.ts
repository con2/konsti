import { ListElement } from "eventassigner-random/lib/typings/list";
import { Input } from "server/types/resultTypes";

export interface Group {
  id: id; // Group id
  size: number; // Group size
  pref: id[]; // Program item wishes (program item id)
}

export interface Event {
  id: id; // program item id
  min: number; // program item min players
  max: number; // program item max players
  groups: readonly Group[]; // groups signed for the program item
}

export interface RandomAssignEvent {
  id: id;
  min: number;
  max: number;
  groups: id[];
}

export interface ListItem {
  id: id; // group id
  size: number; // group size
  event: id; // program item id for the signed program item
  gain: number; // preference: 1st choice => 1, 2nd choice => 0.5, 3rd choice => 0.33
}

export interface RandomAssignUpdateLInput {
  groups: Group[];
  events: RandomAssignEvent[];
  assignment: PadgRandomAssignResult[];
  unassignedGroups: Group[];
  L: ListElement[];
  groupId: id;
}

export interface PadgInput {
  groups: readonly Group[];
  events: readonly Event[];
  list: readonly ListItem[];
  updateL: (input: Input) => string;
}

interface PadgRandomAssignResult {
  id: id; // group id
  assignment: id; // assigned program item id
}

type id = string | number;

export type PadgRandomAssignResults = readonly PadgRandomAssignResult[];

export interface PadgError {
  result: 0;
  events: number[];
  flag: string;
}
