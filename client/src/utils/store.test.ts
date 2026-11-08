import { captureException, close, flush, init } from "@sentry/react";
import { afterEach, expect, test } from "vitest";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";
import { UserGroup } from "shared/types/models/user";
import { getSentryOptions } from "client/utils/sentryOptions";
import { store } from "client/utils/store";
import { updateServerAppBuildTime } from "client/views/admin/adminSlice";
import { submitLoginAsync } from "client/views/login/loginSlice";

afterEach(async () => {
  await close();
});

test("should send Sentry only the Redux action types", async () => {
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
  const sent = JSON.stringify(events[0]);
  for (const privateValue of [jwt, email, serial, "test1"]) {
    expect(sent).not.toContain(privateValue);
  }
});
