import { randomUUID } from "node:crypto";
import { subHours } from "date-fns";
import { testProgramItem } from "shared/tests/testProgramItem";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { LotterySignup, User, UserGroup } from "shared/types/models/user";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export const assignmentTime = testProgramItem.startTime;
export const groupCreatorGroupCode = "123-234-345";

// A spot from an earlier lottery, an hour before the run's time unless given otherwise
export const getPreviousDirectSignup = ({
  username,
  parentStartTime,
  programItemId = testProgramItem.programItemId,
  priority = 1,
  signedToStartTime = subHours(
    new Date(parentStartTime ?? assignmentTime),
    1,
  ).toISOString(),
}: {
  username: string;
  parentStartTime?: string;
  programItemId?: string;
  priority?: number;
  signedToStartTime?: string;
}): DirectSignupsForProgramItem => {
  return {
    programItemId,
    userSignups: [
      {
        username,
        priority,
        signedToStartTime,
        signupTime: assignmentTime,
        message: "",
      },
    ],
    count: 1,
  };
};

export const getEventLogItem = ({
  action,
  programItemId = testProgramItem.programItemId,
  programItemStartTime = assignmentTime,
}: {
  action: EventLogAction;
  programItemId?: string;
  programItemStartTime?: string;
}): EventLogItem => {
  return {
    eventLogItemId: randomUUID(),
    action,
    isSeen: false,
    programItemId,
    programItemStartTime,
    createdAt: programItemStartTime,
  };
};

const getLotterySignups = (): LotterySignup[] => {
  return [
    {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: assignmentTime,
    },
  ];
};

const getPastLotterySignupEvents = ({
  pastFailureLotterySignups,
  pastSuccessLotterySignups,
  pastAssignmentProgramItemId = testProgramItem.programItemId,
}: {
  pastFailureLotterySignups: number;
  pastSuccessLotterySignups: number;
  pastAssignmentProgramItemId?: string;
}): EventLogItem[] => {
  const eventLogItems: EventLogItem[] = [];
  for (let i = 0; i < pastFailureLotterySignups; i++) {
    eventLogItems.push({
      eventLogItemId: randomUUID(),
      action: EventLogAction.NO_ASSIGNMENT,
      isSeen: false,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: subHours(
        new Date(assignmentTime),
        i + 1,
      ).toISOString(),
      createdAt: subHours(new Date(assignmentTime), 1).toISOString(),
    });
  }

  for (let i = 0; i < pastSuccessLotterySignups; i++) {
    eventLogItems.push({
      eventLogItemId: randomUUID(),
      action: EventLogAction.NEW_ASSIGNMENT,
      isSeen: false,
      programItemId: pastAssignmentProgramItemId,
      programItemStartTime: subHours(
        new Date(assignmentTime),
        i + 1,
      ).toISOString(),
      createdAt: subHours(new Date(assignmentTime), 1).toISOString(),
    });
  }

  return eventLogItems;
};

export const getUsers = ({
  count,
  noLotterySignups = false,
  pastLotterySignupUsers = 0,
  pastFailureLotterySignups = 0,
  pastSuccessLotterySignups = 0,
  pastAssignmentProgramItemId,
}: {
  count: number;
  noLotterySignups?: boolean;
  pastLotterySignupUsers?: number;
  pastSuccessLotterySignups?: number;
  pastFailureLotterySignups?: number;
  pastAssignmentProgramItemId?: string;
}): User[] => {
  const users: User[] = [];
  let pastLotterySignupUsersCounter = pastLotterySignupUsers;

  for (let i = 0; i < count; i++) {
    const defaultUserValues = {
      kompassiId: "",
      kompassiUsernameAccepted: false,
      password: "password",
      userGroup: UserGroup.USER,
      serial: `12${i}`,
      groupCode: groupCreatorGroupCode,
      favoriteProgramItemIds: [],
      createdAt: subHours(new Date(assignmentTime), 4).toISOString(),
      email: "",
      emailNotificationPermitAsked: false,
    };

    if (i === 0) {
      users.push({
        ...defaultUserValues,
        username: "group-creator-with-lottery-signup",
        isGroupCreator: true,
        lotterySignups: noLotterySignups ? [] : getLotterySignups(),
        eventLogItems:
          pastLotterySignupUsersCounter > 0
            ? getPastLotterySignupEvents({
                pastFailureLotterySignups,
                pastSuccessLotterySignups,
                pastAssignmentProgramItemId,
              })
            : [],
      });
    } else {
      users.push({
        ...defaultUserValues,
        username: `group-member-${i}`,
        isGroupCreator: false,
        lotterySignups: [],
        eventLogItems:
          pastLotterySignupUsersCounter > 0
            ? getPastLotterySignupEvents({
                pastFailureLotterySignups,
                pastSuccessLotterySignups,
                pastAssignmentProgramItemId,
              })
            : [],
      });
    }

    pastLotterySignupUsersCounter--;
  }

  return users;
};
