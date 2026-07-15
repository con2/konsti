import { expect, test } from "vitest";
import { isSignupConfirmDisabled } from "client/views/program-item/signup/components/signupFormUtils";

test("is disabled when an entry condition exists but is not agreed", () => {
  expect(isSignupConfirmDisabled(true, false)).toEqual(true);
});

test("is enabled when the entry condition is agreed", () => {
  expect(isSignupConfirmDisabled(true, true)).toEqual(false);
});

test("is enabled when there is no entry condition", () => {
  expect(isSignupConfirmDisabled(false, false)).toEqual(false);
});
