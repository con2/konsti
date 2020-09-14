export interface Game {
  gameId: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  mins: number;
  tags: readonly string[];
  genres: readonly string[];
  styles: readonly string[];
  language: string;
  endTime: string;
  people: string;
  minAttendance: number;
  maxAttendance: number;
  gameSystem: string;
  englishOk: boolean;
  childrenFriendly: boolean;
  ageRestricted: boolean;
  beginnerFriendly: boolean;
  intendedForExperiencedParticipants: boolean;
  shortDescription: string;
  revolvingDoor: boolean;
  popularity: number;
  programType: string;
}

export interface DnDUpdatedPositions {
  availableGames?: readonly Game[];
  selectedGames?: readonly Game[];
}

export interface DnDMove {
  index: number;
  droppableId: string;
}

export interface PostGamesUpdateResponse {
  games: Game[];
  message: string;
  status: 'success';
}

export interface GetGamesResponse {
  games: Game[];
  message: string;
  status: 'success';
}

export interface PostHiddenResponse {
  hiddenGames: Game[];
  message: string;
  status: 'success';
}
