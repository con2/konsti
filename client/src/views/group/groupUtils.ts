export const getIsInGroup = (groupCode: string): boolean => {
  return !!(groupCode && groupCode !== "0");
};

// A user may sign up for and cancel their own lottery sign-ups unless they are a group
// member viewing the group creator's sign-ups (only the creator acts on the group's sign-ups)
export const canSignToProgramItems = (
  isInGroup: boolean,
  isGroupCreator: boolean,
): boolean => !isInGroup || isGroupCreator;
