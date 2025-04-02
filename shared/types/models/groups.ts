import { LotterySignup } from "shared/types/models/user";

export interface GroupMember {
  groupCode: string;
  groupCreatorCode: string;
  serial: string;
  lotterySignups: readonly LotterySignup[];
  username: string;
}
