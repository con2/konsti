import { SelectedGame } from "shared/types/models/user";

export interface GroupMember {
  groupCode: string;
  groupCreatorCode: string;
  serial: string;
  signedGames: readonly SelectedGame[];
  username: string;
}
