import { afterEach, describe, expect, test } from "vitest";
import { combineConfig } from "shared/config/serverConfig";

const originalNodeEnv = process.env.NODE_ENV;
const originalSettings = process.env.SETTINGS;

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }
  if (originalSettings === undefined) {
    delete process.env.SETTINGS;
  } else {
    process.env.SETTINGS = originalSettings;
  }
});

describe("combineConfig", () => {
  test("throws in a production deployment when SETTINGS is missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.SETTINGS;
    expect(() => combineConfig()).toThrow();
  });

  test("throws in a production deployment when SETTINGS is an unrecognized value", () => {
    process.env.NODE_ENV = "production";
    process.env.SETTINGS = "prod";
    expect(() => combineConfig()).toThrow();
  });

  test("does not fall back to development JWT secrets in a production deployment", () => {
    process.env.NODE_ENV = "production";
    process.env.SETTINGS = "production";
    expect(combineConfig().jwtSecretKey).not.toEqual("secret");
  });

  test("allows an intentionally deployed development environment", () => {
    process.env.NODE_ENV = "production";
    process.env.SETTINGS = "development";
    expect(combineConfig().jwtSecretKey).toEqual("secret");
  });

  test("allows development secrets when not a production deployment", () => {
    process.env.NODE_ENV = "test";
    delete process.env.SETTINGS;
    expect(combineConfig().jwtSecretKey).toEqual("secret");
  });
});
