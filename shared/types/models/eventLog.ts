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
}
