export interface EventLogItem {
  eventLogItemId: string;
  action: EventLogAction;
  isSeen: boolean;
  programItemId: string;
}

export enum EventLogAction {
  NEW_ASSIGNMENT = "newAssignment",
}
