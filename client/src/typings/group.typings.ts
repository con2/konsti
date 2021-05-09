import { SelectedGame } from 'shared/typings/models/user';

export interface GroupMember {
  enteredGames: readonly SelectedGame[];
  groupCode: string;
  serial: string;
  signedGames: readonly SelectedGame[];
  username: string;
}
