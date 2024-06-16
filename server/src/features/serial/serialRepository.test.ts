import { expect, test, vi, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { saveSerials } from "server/features/serial/serialRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

vi.mock("generate-serial-number", () => {
  const serials: string[] = [
    "a1234",
    "a1234",
    "b5225",
    "c2512",
    "a1234", // this is a duplicate and should not be saved
    "d1232",
    "a1234",
    "b5225",
    "c2512",
    "a1234", // this is a duplicate and should not be saved
    "d1232",
    "e12039",
    "f1259105",
  ];

  let ind = -1;

  function _nextArrayElement(arr: string[]): string {
    ind += 1;
    return arr[ind];
  }

  function generate(_count: number): string {
    return _nextArrayElement(serials);
  }

  return {
    default: { generate },
  };
});

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new serial into collection", async () => {
  const result = unsafelyUnwrap(await saveSerials(1));
  expect(result.length).toEqual(1);
  expect(result[0].serial).toEqual("a1234");
});

test("should not insert same serial into collection when creating", async () => {
  const savedSerials = unsafelyUnwrap(await saveSerials(4));
  const results = savedSerials.map((serial) => serial.serial);
  expect(results.length).toEqual(4);
  expect(results).toEqual(["a1234", "b5225", "c2512", "d1232"]);
});

test("should not insert same serial into collection if the serial is in a collection", async () => {
  // save the first serial into the collection
  await saveSerials(1);
  const savedSerials = unsafelyUnwrap(await saveSerials(4));
  const results = savedSerials.map((serial) => serial.serial);
  expect(results.length).toEqual(4);
  expect(results).toEqual(["b5225", "c2512", "d1232", "e12039"]);
});
