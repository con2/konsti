import dayjs from "dayjs";
import { faker } from "@faker-js/faker";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { LotterySignup, User, UserGroup } from "shared/types/models/user";

export const assignmentTime = testProgramItem.startTime;
export const groupCreatorGroupCode = "123-234-345";

export const getPreviousDirectSignup = ({
  username,
  parentStartTime,
}: {
  username: string;
  parentStartTime?: string;
}): DirectSignupsForProgramItem => {
  return {
    programItemId: testProgramItem.programItemId,
    userSignups: [
      {
        username,
        priority: 1,
        signedToStartTime: dayjs(parentStartTime ?? assignmentTime)
          .subtract(1, "hours")
          .toISOString(),
        message: "",
      },
    ],
    count: 0,
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
}: {
  pastFailureLotterySignups: number;
  pastSuccessLotterySignups: number;
}): EventLogItem[] => {
  const eventLogItems: EventLogItem[] = [];
  for (let i = 0; i < pastFailureLotterySignups; i++) {
    eventLogItems.push({
      eventLogItemId: faker.string.alphanumeric(10),
      action: EventLogAction.NO_ASSIGNMENT,
      isSeen: false,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: dayjs(assignmentTime)
        .subtract(i + 1, "hours")
        .toISOString(),
      createdAt: dayjs(assignmentTime).subtract(1, "hours").toISOString(),
    });
  }

  for (let i = 0; i < pastSuccessLotterySignups; i++) {
    eventLogItems.push({
      eventLogItemId: faker.string.alphanumeric(10),
      action: EventLogAction.NEW_ASSIGNMENT,
      isSeen: false,
      programItemId: testProgramItem.programItemId,
      programItemStartTime: dayjs(assignmentTime)
        .subtract(i + 1, "hours")
        .toISOString(),
      createdAt: dayjs(assignmentTime).subtract(1, "hours").toISOString(),
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
}: {
  count: number;
  noLotterySignups?: boolean;
  pastLotterySignupUsers?: number;
  pastSuccessLotterySignups?: number;
  pastFailureLotterySignups?: number;
}): User[] => {
  const users: User[] = [];
  let pastLotterySignupUsersCounter = pastLotterySignupUsers;

  for (let i = 0; i < count; i++) {
    const defaultUserValues = {
      kompassiId: 0,
      kompassiUsernameAccepted: false,
      password: "password",
      userGroup: UserGroup.USER,
      serial: `12${i}`,
      groupCode: groupCreatorGroupCode,
      favoriteProgramItemIds: [],
      createdAt: dayjs(assignmentTime).subtract(4, "hours").toISOString(),
    };

    if (i === 0) {
      users.push({
        ...defaultUserValues,
        username: "group-creator-with-lottery-signup",
        groupCreatorCode: groupCreatorGroupCode,
        lotterySignups: noLotterySignups ? [] : getLotterySignups(),
        eventLogItems:
          pastLotterySignupUsersCounter > 0
            ? getPastLotterySignupEvents({
                pastFailureLotterySignups,
                pastSuccessLotterySignups,
              })
            : [],
      });
    } else {
      users.push({
        ...defaultUserValues,
        username: `group-member-${i}`,
        groupCreatorCode: "0",
        lotterySignups: [],
        eventLogItems:
          pastLotterySignupUsersCounter > 0
            ? getPastLotterySignupEvents({
                pastFailureLotterySignups,
                pastSuccessLotterySignups,
              })
            : [],
      });
    }

    pastLotterySignupUsersCounter--;
  }

  return users;
};
