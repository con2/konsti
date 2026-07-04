import { expect, test } from "vitest";
import { canSignToProgramItems } from "client/views/group/groupUtils";

test("a user not in a group can act on their own signups", () => {
  expect(canSignToProgramItems(false, false)).toEqual(true);
});

test("a group creator can act on the group's signups", () => {
  expect(canSignToProgramItems(true, true)).toEqual(true);
});

test("a group member cannot act on the creator's signups", () => {
  expect(canSignToProgramItems(true, false)).toEqual(false);
});
