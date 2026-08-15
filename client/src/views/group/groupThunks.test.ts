import { type Store, configureStore } from "@reduxjs/toolkit";
import { type Mock, afterEach, expect, test, vi } from "vitest";
import { UserGroup } from "shared/types/models/user";
import { getGroup, postJoinGroup } from "client/services/groupServices";
import { getUser } from "client/services/userServices";
import { type AppDispatch, type RootState } from "client/types/reduxTypes";
import { combinedReducer } from "client/utils/store";
import { submitJoinGroup } from "client/views/group/groupThunks";
import { submitLoginAsync } from "client/views/login/loginSlice";
import { submitGetUserAsync } from "client/views/my-program-items/myProgramItemsSlice";

vi.mock("client/services/groupServices", () => ({
  postCreateGroup: vi.fn(),
  getGroup: vi.fn(),
  postJoinGroup: vi.fn(),
  postLeaveGroup: vi.fn(),
  postCloseGroup: vi.fn(),
}));

vi.mock("client/services/userServices", () => ({
  getUser: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const setupStore = (): Store<RootState> & { dispatch: AppDispatch } =>
  configureStore({ reducer: combinedReducer });

test("joining a group refreshes the user's own lottery signups", async () => {
  const store = setupStore();

  store.dispatch(
    submitLoginAsync({
      username: "test1",
      loggedIn: true,
      jwt: "jwt",
      userGroup: UserGroup.USER,
      serial: "1234",
      eventLogItems: [],
      kompassiUsernameAccepted: false,
      kompassiId: "",
      email: "",
      emailNotificationPermitAsked: false,
    }),
  );

  // User has an upcoming lottery sign-up before joining
  store.dispatch(
    submitGetUserAsync({
      directSignups: [],
      favoriteProgramItemIds: [],
      lotterySignups: [
        {
          programItemId: "p1",
          priority: 1,
          signedToStartTime: "2026-07-24T12:00:00.000Z",
        },
      ],
    }),
  );

  (postJoinGroup as Mock).mockResolvedValue({
    status: "success",
    message: "",
    groupCode: "123-456-789",
  });
  (getGroup as Mock).mockResolvedValue({
    status: "success",
    message: "",
    results: [],
  });
  // The server clears the joining member's upcoming lottery sign-ups
  (getUser as Mock).mockResolvedValue({
    status: "success",
    message: "",
    programItems: {
      directSignups: [],
      favoriteProgramItemIds: [],
      lotterySignups: [],
    },
    serial: "1234",
    groupCode: "123-456-789",
    isGroupCreator: false,
    username: "test1",
    eventLogItems: [],
    email: "",
  });

  await store.dispatch(submitJoinGroup({ groupCode: "123-456-789" }));

  expect(store.getState().myProgramItems.lotterySignups).toHaveLength(0);
});
