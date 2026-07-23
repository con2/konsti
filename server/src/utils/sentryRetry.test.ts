import { expect, test, vi, describe } from "vitest";
import {
  flattenErrorMessageChain,
  retryWithDelays,
} from "server/utils/sentryRetry";

describe("retryWithDelays", () => {
  test("should not retry when first result passes", async () => {
    const run = vi.fn().mockResolvedValue("ok");

    const result = await retryWithDelays([0, 0], run, () => false);

    expect(result).toEqual("ok");
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("should stop retrying when a result passes", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce("fail")
      .mockResolvedValueOnce("ok");

    const result = await retryWithDelays(
      [0, 0],
      run,
      (value) => value === "fail",
    );

    expect(result).toEqual("ok");
    expect(run).toHaveBeenCalledTimes(2);
  });

  test("should run at most once per delay after the first attempt", async () => {
    const run = vi.fn().mockResolvedValue("fail");

    const result = await retryWithDelays([0, 0], run, () => true);

    expect(result).toEqual("fail");
    expect(run).toHaveBeenCalledTimes(3);
  });
});

describe("flattenErrorMessageChain", () => {
  test("should join cause chain messages", () => {
    const error = new TypeError("fetch failed", {
      cause: new Error("read ECONNRESET"),
    });

    expect(flattenErrorMessageChain(error)).toEqual(
      "fetch failed / read ECONNRESET",
    );
  });

  test("should include AggregateError members", () => {
    const error = new TypeError("fetch failed", {
      // eslint-disable-next-line unicorn/error-message -- Node network AggregateErrors have no message
      cause: new AggregateError([
        new Error("connect ETIMEDOUT 34.160.81.0:443"),
        new Error("connect ENETUNREACH 2600:1901:0:5e8a:::443"),
      ]),
    });

    expect(flattenErrorMessageChain(error)).toEqual(
      "fetch failed / connect ETIMEDOUT 34.160.81.0:443 / connect ENETUNREACH 2600:1901:0:5e8a:::443",
    );
  });

  test("should stringify non-Error values", () => {
    expect(flattenErrorMessageChain("boom")).toEqual("boom");
  });
});
