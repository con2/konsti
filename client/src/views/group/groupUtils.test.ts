import { expect, test } from "vitest";
import { canSignToProgramItems } from "client/views/group/groupUtils";

test("a user not in a group can act on their own lottery sign-ups", () => {
  expect(canSignToProgramItems(false, false)).toEqual(true);
});

test("a group creator can act on the group's lottery sign-ups", () => {
  expect(canSignToProgramItems(true, true)).toEqual(true);
});

test("a group member cannot act on the creator's lottery sign-ups", () => {
  expect(canSignToProgramItems(true, false)).toEqual(false);
});
