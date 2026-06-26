import { expect, test, describe } from "vitest";
import { type ErrorEvent } from "@sentry/node";
import { scrubIpAddress } from "server/utils/scrubIpAddress";

describe("scrubIpAddress", () => {
  test("should remove user.ip_address", () => {
    const event = {
      user: { id: "123", ip_address: "203.0.113.5" },
    } as ErrorEvent;

    const scrubbed = scrubIpAddress(event);

    expect(scrubbed.user).toEqual({ id: "123" });
  });

  test("should remove IP-carrying request headers regardless of casing", () => {
    const event = {
      request: {
        headers: {
          "X-Forwarded-For": "203.0.113.5",
          "x-real-ip": "203.0.113.5",
          Forwarded: "for=203.0.113.5",
          "Content-Type": "application/json",
        },
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubIpAddress(event);

    expect(scrubbed.request?.headers).toEqual({
      "Content-Type": "application/json",
    });
  });

  test("should not fail when user and request are missing", () => {
    const event = {} as ErrorEvent;

    expect(scrubIpAddress(event)).toEqual({});
  });
});
