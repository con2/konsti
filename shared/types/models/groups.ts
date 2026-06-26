import { LotterySignup } from "shared/types/models/user";

export interface GroupMember {
  groupCode: string;
  isGroupCreator: boolean;
  serial: string;
  lotterySignups: readonly LotterySignup[];
  username: string;
}
