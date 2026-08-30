import { addHours, addMinutes, subMinutes } from "date-fns";
import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  getLotterySignups,
  getUpcomingDirectSignups,
  getUpcomingFavorites,
  getUpcomingProgramItems,
  isMainEventProgramVisible,
} from "client/utils/getUpcomingProgramItems";
import { GroupMemberWithLotteryProgramItem } from "client/views/group/groupSlice";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";

const mainEventProgramVisibleTime = "2026-07-23T17:00:00Z";
const startTime = "2026-07-24T13:00:00Z";

const programItemAt = (
  programItemId: string,
  overrides: Partial<typeof testProgramItem> = {},
): typeof testProgramItem => ({
  ...testProgramItem,
  programItemId,
  startTime,
  ...overrides,
});

const lotterySignupFor = (
  programItem: typeof testProgramItem,
): LotterySignupWithProgramItem => ({
  programItemId: programItem.programItemId,
  priority: 1,
  signedToStartTime: programItem.startTime,
  programItem,
});

const directSignupFor = (
  programItem: typeof testProgramItem,
): DirectSignupWithProgramItem => ({
  programItemId: programItem.programItemId,
  priority: 0,
  signedToStartTime: programItem.startTime,
  message: "",
  programItem,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isMainEventProgramVisible", () => {
  test("returns false before the main event program visible time", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      mainEventProgramVisibleTime,
    });
    const timeNow = subMinutes(new Date(mainEventProgramVisibleTime), 1);
    expect(isMainEventProgramVisible(timeNow)).toEqual(false);
  });

  test("returns true at the main event program visible time", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      mainEventProgramVisibleTime,
    });
    const timeNow = new Date(mainEventProgramVisibleTime);
    expect(isMainEventProgramVisible(timeNow)).toEqual(true);
  });

  test("returns true when no main event program visible time is configured", () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      mainEventProgramVisibleTime: null,
    });
    expect(isMainEventProgramVisible(new Date("2020-01-01T00:00:00Z"))).toEqual(
      true,
    );
  });
});

describe("getUpcomingProgramItems", () => {
  const programItem = programItemAt("upcoming");

  // Direct sign-up ends when the program item starts, so the start time is the
  // boundary the whole program list hangs on
  test("keeps a program item whose direct sign-up is still open", () => {
    const timeNow = subMinutes(new Date(startTime), 1);
    expect(getUpcomingProgramItems([programItem], timeNow)).toEqual([
      programItem,
    ]);
  });

  test("keeps a program item exactly at its direct sign-up end time", () => {
    expect(getUpcomingProgramItems([programItem], new Date(startTime))).toEqual(
      [programItem],
    );
  });

  test("drops a program item whose direct sign-up has ended", () => {
    const timeNow = addMinutes(new Date(startTime), 1);
    expect(getUpcomingProgramItems([programItem], timeNow)).toEqual([]);
  });
});

describe("getUpcomingDirectSignups", () => {
  const directSignup = directSignupFor(programItemAt("direct"));

  // Direct sign-ups stay listed for an hour after the program item starts, so
  // an attendee can still find the one they are currently attending
  test("keeps a direct sign-up until an hour past the start time", () => {
    const timeNow = addMinutes(new Date(startTime), 59);
    expect(getUpcomingDirectSignups([directSignup], timeNow)).toEqual([
      directSignup,
    ]);
  });

  test("drops a direct sign-up an hour past the start time", () => {
    const timeNow = addHours(new Date(startTime), 1);
    expect(getUpcomingDirectSignups([directSignup], timeNow)).toEqual([]);
  });
});

describe("getUpcomingFavorites", () => {
  test("keeps a favorite until an hour past the start time", () => {
    const programItem = programItemAt("favorite");
    const timeNow = addMinutes(new Date(startTime), 59);
    expect(getUpcomingFavorites([programItem], timeNow)).toEqual([programItem]);
  });

  // A sub-session's own start time can sit hours after the parent's, so the
  // override decides when it drops off the list
  test("uses the parent start time when the program item has one", () => {
    const parentId = "parent";
    const programItem = programItemAt("child", {
      parentId,
      startTime: addHours(new Date(startTime), 5).toISOString(),
    });
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map([[parentId, startTime]]),
    });

    const timeNow = addHours(new Date(startTime), 1);
    expect(getUpcomingFavorites([programItem], timeNow)).toEqual([]);
  });
});

describe("getLotterySignups", () => {
  const ownProgramItem = programItemAt("own");
  const ownSignups = [lotterySignupFor(ownProgramItem)];
  const creatorSignups = [lotterySignupFor(programItemAt("creator"))];
  const groupMembers: GroupMemberWithLotteryProgramItem[] = [
    {
      ...config.event(),
      isGroupCreator: true,
      lotterySignups: creatorSignups,
    } as unknown as GroupMemberWithLotteryProgramItem,
  ];
  const timeNow = new Date(startTime);

  test("shows own lottery sign-ups when not in a group", () => {
    expect(
      getLotterySignups({
        lotterySignups: ownSignups,
        isGroupCreator: false,
        groupMembers: [],
        isInGroup: false,
        showAllProgramItems: true,
        timeNow,
      }),
    ).toEqual(ownSignups);
  });

  // Group members sign up through the creator, so their own list is not what
  // the lottery acts on
  test("shows the group creator's lottery sign-ups to a group member", () => {
    expect(
      getLotterySignups({
        lotterySignups: ownSignups,
        isGroupCreator: false,
        groupMembers,
        isInGroup: true,
        showAllProgramItems: true,
        timeNow,
      }),
    ).toEqual(creatorSignups);
  });

  test("returns nothing when the group has no creator", () => {
    expect(
      getLotterySignups({
        lotterySignups: ownSignups,
        isGroupCreator: false,
        groupMembers: [],
        isInGroup: true,
        showAllProgramItems: true,
        timeNow,
      }),
    ).toEqual([]);
  });

  test("filters out past lottery sign-ups unless all program items are shown", () => {
    const params = {
      lotterySignups: ownSignups,
      isGroupCreator: false,
      groupMembers: [],
      isInGroup: false,
      timeNow: addHours(new Date(startTime), 2),
    };

    expect(getLotterySignups({ ...params, showAllProgramItems: true })).toEqual(
      ownSignups,
    );
    expect(
      getLotterySignups({ ...params, showAllProgramItems: false }),
    ).toEqual([]);
  });
});
