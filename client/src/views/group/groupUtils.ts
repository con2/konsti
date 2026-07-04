export const getIsInGroup = (groupCode: string): boolean => {
  return !!(groupCode && groupCode !== "0");
};

// A user may sign up for and cancel their own lottery signups unless they are a group
// member viewing the group creator's signups (only the creator acts on the group's signups)
export const canSignToProgramItems = (
  isInGroup: boolean,
  isGroupCreator: boolean,
): boolean => !isInGroup || isGroupCreator;
