import { expect, test } from "vitest";
import { formatSerial } from "shared/utils/formatSerial";

test("hyphenates a ten digit serial into groups of three", () => {
  expect(formatSerial("0123048001")).toEqual("012-304-800-1");
});

test("does not add a trailing hyphen when length is a multiple of three", () => {
  expect(formatSerial("012304800")).toEqual("012-304-800");
});

test("leaves serials of three or fewer characters unchanged", () => {
  expect(formatSerial("012")).toEqual("012");
  expect(formatSerial("")).toEqual("");
});
