export const getIsGroupCreator = (
  groupCode: string,
  serial: string
): boolean => {
  if (groupCode === serial) {
    return true;
  }
  if (groupCode === "0") {
    return true;
  }
  return false;
};
