export interface EventLogItem {
  eventLogItemId: string;
  action: EventLogAction;
  isSeen: boolean;
  eventItemId: string;
}

export enum EventLogAction {
  NEW_ASSIGNMENT = "newAssignment",
}
