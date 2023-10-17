export const getIsInGroup = (groupCode: string): boolean => {
  return !!(groupCode && groupCode !== "0");
};
