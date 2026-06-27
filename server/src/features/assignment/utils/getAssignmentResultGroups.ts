import { groupBy } from "remeda";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import { AssignmentResultGroup } from "shared/types/models/result";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { getGroupCreators } from "server/features/assignment/utils/getGroupCreators";
import { getGroupMembersWithCreatorLotterySignups } from "server/features/assignment/utils/getGroupMembers";

// Snapshot the groups that took part in the lottery for this assignment time, as they were when it ran
export const getAssignmentResultGroups = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  assignmentTime: string,
): AssignmentResultGroup[] => {
  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  );
  const groupCreators = getGroupCreators(users, startingProgramItems);
  const groupMembers = getGroupMembersWithCreatorLotterySignups(
    groupCreators,
    users,
  );
  const allAttendees = [...groupCreators, ...groupMembers];

  // Drop individual users (groupCode "0"); keep only actual groups
  const attendeesInGroups = allAttendees.filter(
    (attendee) => attendee.groupCode !== "0",
  );

  return Object.entries(
    groupBy(attendeesInGroups, (attendee) => attendee.groupCode),
  ).map(([groupCode, members]) => ({
    groupCode,
    groupMembers: members.map((member) => member.username),
  }));
};
