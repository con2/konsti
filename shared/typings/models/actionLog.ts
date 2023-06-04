export interface ActionLogItem {
  actionLogItemId: string;
  action: ActionLogAction;
  isSeen: boolean;
  eventItemId: string;
}

export enum ActionLogAction {
  NEW_ASSIGNMENT = "newAssignment",
}
