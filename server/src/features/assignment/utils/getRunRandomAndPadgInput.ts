import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { getLotterySignups } from "server/features/assignment/utils/getLotterySignups";
import { getLotterySignupProgramItems } from "server/features/assignment/utils/getLotterySignupProgramItems";
import { getGroupCreators } from "server/features/assignment/utils/getGroupCreators";
import { getAttendeeGroups } from "server/features/assignment/utils/getAttendeeGroups";
import { getGroupMembersWithCreatorLotterySignups } from "server/features/assignment/utils/getGroupMembers";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import { RunRandomAndPadgInput } from "server/types/resultTypes";

export const getRunRandomAndPadgInput = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
): RunRandomAndPadgInput => {
  const startingProgramItems = getStartingProgramItems(programItems, startTime);

  if (startingProgramItems.length === 0) {
    return {
      lotterySignupProgramItems: [],
      attendeeGroups: [],
      allAttendees: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
    };
  }

  const lotterySignups = getLotterySignups(users);

  if (lotterySignups.length === 0) {
    return {
      lotterySignupProgramItems: [],
      attendeeGroups: [],
      allAttendees: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
    };
  }

  const lotterySignupProgramItems = getLotterySignupProgramItems(
    startingProgramItems,
    lotterySignups,
  );

  // Get group creators, selected users are group creators since group members don't have signups yet
  const groupCreators = getGroupCreators(users, startingProgramItems);

  // Get group members based on group creators
  const groupMembers = getGroupMembersWithCreatorLotterySignups(
    groupCreators,
    users,
  );

  // Combine group creators and group members
  const allAttendees = groupCreators.concat(groupMembers);

  // Combine users to groups, single user is size 1 group
  const attendeeGroups = getAttendeeGroups(allAttendees);

  let numberOfIndividuals = 0;
  let numberOfGroups = 0;
  for (const attendeeGroup of attendeeGroups) {
    if (attendeeGroup.length > 1) {
      numberOfGroups += 1;
    } else {
      numberOfIndividuals += 1;
    }
  }

  return {
    lotterySignupProgramItems,
    attendeeGroups,
    allAttendees,
    numberOfIndividuals,
    numberOfGroups,
  };
};
