import { Signup } from "shared/types/models/user";

export interface GroupMember {
  groupCode: string;
  groupCreatorCode: string;
  serial: string;
  lotterySignups: readonly Signup[];
  username: string;
}
