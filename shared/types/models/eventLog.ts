export interface EventLogItem {
  eventLogItemId: string;
  action: EventLogAction;
  isSeen: boolean;
  programItemId: string;
  programItemStartTime: string;
  createdAt: string;
}

export enum EventLogAction {
  NEW_ASSIGNMENT = "newAssignment",
  NO_ASSIGNMENT = "noAssignment",
  PROGRAM_ITEM_CANCELLED = "programItemCancelled",
  PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE = "programItemNoKonstiSignupAnymore",
  PROGRAM_ITEM_NO_LOTTERY_ANYMORE = "programItemNoLotteryAnymore",
  PROGRAM_ITEM_MOVED = "programItemMoved",
}
