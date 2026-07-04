import { expect, test } from "vitest";
import { isSignupConfirmDisabled } from "client/views/program-item/signup/components/signupFormUtils";

test("is disabled while loading even when the entry condition is agreed", () => {
  expect(isSignupConfirmDisabled(true, true, true)).toEqual(true);
});

test("is disabled while loading when there is no entry condition", () => {
  expect(isSignupConfirmDisabled(false, false, true)).toEqual(true);
});

test("is disabled when an entry condition exists but is not agreed", () => {
  expect(isSignupConfirmDisabled(true, false, false)).toEqual(true);
});

test("is enabled when the entry condition is agreed and not loading", () => {
  expect(isSignupConfirmDisabled(true, true, false)).toEqual(false);
});

test("is enabled when there is no entry condition and not loading", () => {
  expect(isSignupConfirmDisabled(false, false, false)).toEqual(false);
});
