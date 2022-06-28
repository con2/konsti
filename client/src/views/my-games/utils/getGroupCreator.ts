import { GroupMember } from "shared/typings/api/groups";

export const getGroupCreator = (
  groupMembers: readonly GroupMember[]
): GroupMember | null => {
  const groupCreator = groupMembers.find(
    (member) => member.serial === member.groupCode
  );
  if (!groupCreator) return null;
  return groupCreator;
};
