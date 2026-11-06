import { expect, test } from "vitest";
import { isEnumValue } from "shared/utils/isEnumValue";

enum Fruit {
  APPLE = "apple",
  PEAR = "pear",
}

test("should accept a value of the enum", () => {
  expect(isEnumValue(Fruit, "pear")).toBe(true);
});

test("should reject a value outside the enum", () => {
  expect(isEnumValue(Fruit, "plum")).toBe(false);
});

// The keys of a string enum are not among its values
test("should reject an enum key", () => {
  expect(isEnumValue(Fruit, "APPLE")).toBe(false);
});
