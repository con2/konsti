import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { getAttendeeGroups } from "server/features/assignment/utils/getAttendeeGroups";
import { getGroupCreators } from "server/features/assignment/utils/getGroupCreators";
import { getGroupMembersWithCreatorLotterySignups } from "server/features/assignment/utils/getGroupMembers";
import { getLotterySignupProgramItems } from "server/features/assignment/utils/getLotterySignupProgramItems";
import { getLotterySignups } from "server/features/assignment/utils/getLotterySignups";
import { RunRandomAndPadgInput } from "server/types/resultTypes";

// TODO: When using PADG+random, this is called twice - lift higher
export const getRandomAndPadgInput = (
  users: readonly User[],
  startingProgramItems: readonly ProgramItem[],
): RunRandomAndPadgInput => {
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

  // Get group creators, selected users are group creators since group members don't have sign-ups yet
  const groupCreators = getGroupCreators(users, startingProgramItems);

  // Get group members based on group creators
  const groupMembers = getGroupMembersWithCreatorLotterySignups(
    groupCreators,
    users,
  );

  // Combine group creators and group members
  const allAttendees = [...groupCreators, ...groupMembers];

  // A group is the unit the lottery places; individuals become groups of one
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
