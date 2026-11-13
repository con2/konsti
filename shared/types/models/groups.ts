import { LotterySignup } from "shared/types/models/user";

export interface GroupMember {
  groupCode: string;
  isGroupCreator: boolean;
  lotterySignups: readonly LotterySignup[];
  username: string;
}
