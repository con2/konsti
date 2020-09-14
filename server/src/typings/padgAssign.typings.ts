export interface Group {
  id: string; // Group id
  size: number; // Group size
  pref: readonly string[]; // Game wishes (game id)
}

export interface Event {
  id: string; // game id
  min: number; // game min players
  max: number; // game max players
  groups: readonly Group[]; // groups signed for the game
}

export interface ListItem {
  id: string; // group id
  size: number; // group size
  event: string; // game id for the signed game
  gain: number; // preference: 1st choice => 1, 2nd choice => 0.5, 3rd choice => 0.33
}

export interface Input {
  groups: readonly Group[];
  events: readonly Event[];
  list: readonly ListItem[];
  updateL: Function;
}

interface PadgAssignResult {
  id: string; // group id
  assignment: string | -1; // assigned game id
}

export type PadgAssignResults = readonly PadgAssignResult[];
