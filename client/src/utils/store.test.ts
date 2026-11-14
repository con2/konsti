import { captureException, close, flush, init } from "@sentry/react";
import { afterEach, expect, test } from "vitest";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";
import { UserGroup } from "shared/types/models/user";
import { SUBMIT_LOGOUT } from "client/types/logoutActionsTypes";
import { getSentryOptions } from "client/utils/sentryOptions";
import { store } from "client/utils/store";
import { updateServerAppBuildTime } from "client/views/admin/adminSlice";
import { submitLoginAsync } from "client/views/login/loginSlice";

afterEach(async () => {
  await close();
});

test("should send Sentry the Redux action types and the account, not the state", async () => {
  const { transport, getCapturedEvents } = createRecordingTransport();
  init({ ...getSentryOptions(), dsn: fakeDsn, transport });
  const jwt = "secret-jwt";
  const email = "attendee@example.local";
  const serial = "0370385477";

  store.dispatch(
    submitLoginAsync({
      username: "test1",
      loggedIn: true,
      jwt,
      userGroup: UserGroup.USER,
      serial,
      eventLogItems: [],
      kompassiUsernameAccepted: false,
      kompassiId: "",
      email,
      emailNotificationPermitAsked: true,
    }),
  );
  store.dispatch(
    updateServerAppBuildTime({ buildTime: "1794136937", receivedAt: 1 }),
  );
  captureException(new Error("Test error"));
  await flush(2000);

  const events = getCapturedEvents();
  expect(events).toHaveLength(1);
  const reduxBreadcrumbs = events[0].breadcrumbs?.filter((breadcrumb) => {
    return breadcrumb.category === "redux.action";
  });
  expect(reduxBreadcrumbs?.map((breadcrumb) => breadcrumb.data)).toEqual([
    { type: submitLoginAsync.type },
  ]);
  expect(events[0].contexts?.state).toBeUndefined();
  expect(events[0].user).toEqual({ id: serial, username: "test1" });
  const sent = JSON.stringify(events[0]);
  for (const privateValue of [jwt, email]) {
    expect(sent).not.toContain(privateValue);
  }
});

test("should clear the Sentry user on logout", async () => {
  const { transport, getCapturedEvents } = createRecordingTransport();
  init({ ...getSentryOptions(), dsn: fakeDsn, transport });

  store.dispatch({ type: SUBMIT_LOGOUT });
  captureException(new Error("Test error"));
  await flush(2000);

  // A cleared user is kept as an object whose fields are all unset
  const { user } = getCapturedEvents()[0];
  expect(user?.id).toBeUndefined();
  expect(user?.username).toBeUndefined();
});
