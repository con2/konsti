import { ProgramType } from "shared/types/models/programItem";

export interface EventLogItem {
  eventLogItemId: string;
  action: EventLogAction;
  isSeen: boolean;
  programItemId: string;
  programItemStartTime: string;
  // The span one lottery covered, both set or neither, and only when it took in more than one
  // starting time
  lotteriedUntil?: string;
  programType?: ProgramType;
  createdAt: string;
}

export enum EventLogAction {
  NEW_ASSIGNMENT = "newAssignment",
  NO_ASSIGNMENT = "noAssignment",
  PROGRAM_ITEM_CANCELLED = "programItemCancelled",
  PROGRAM_ITEM_DELETED = "programItemDeleted",
  PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE = "programItemNoKonstiSignupAnymore",
  PROGRAM_ITEM_NO_LOTTERY_ANYMORE = "programItemNoLotteryAnymore",
  PROGRAM_ITEM_MOVED = "programItemMoved",
}
