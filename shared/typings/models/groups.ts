import { SelectedGame } from "shared/typings/models/user";

export interface GroupMember {
  groupCode: string;
  serial: string;
  signedGames: readonly SelectedGame[];
  username: string;
}