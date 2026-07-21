import { expect, test } from "vitest";
import { joinWithConjunction } from "client/utils/joinWithConjunction";

test("joins an empty list to an empty string", () => {
  expect(joinWithConjunction([], "and")).toEqual("");
});

test("returns a single item as is", () => {
  expect(joinWithConjunction(["larps"], "and")).toEqual("larps");
});

test("joins two items with the conjunction only", () => {
  expect(joinWithConjunction(["larps", "workshops"], "and")).toEqual(
    "larps and workshops",
  );
});

test("joins more items with commas and the conjunction before the last", () => {
  expect(
    joinWithConjunction(["role-playing games", "larps", "workshops"], "ja"),
  ).toEqual("role-playing games, larps ja workshops");
});
