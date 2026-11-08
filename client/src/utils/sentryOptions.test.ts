import type { Breadcrumb } from "@sentry/react";
import {
  captureException,
  close,
  flush,
  getIsolationScope,
  init,
} from "@sentry/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import {
  createRecordingTransport,
  fakeDsn,
} from "shared/tests/sentryTestHelpers";
import { getSentryOptions } from "client/utils/sentryOptions";

const respondWith = vi.fn<() => Response>();

// Stubbed before Sentry wraps fetch on its first init, so the breadcrumbs come from the real
// instrumentation
beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((): Promise<Response> => {
      return Promise.resolve(respondWith());
    }),
  );
});

afterEach(async () => {
  await close();
});

const recordBreadcrumbs = async (
  run: () => Promise<void>,
): Promise<Breadcrumb[]> => {
  const { transport, getCapturedEvents } = createRecordingTransport();
  init({ ...getSentryOptions(), dsn: fakeDsn, transport });
  // Breadcrumbs outlive a client, so an earlier test's would be counted too
  getIsolationScope().clearBreadcrumbs();
  await run();
  captureException(new Error("Test error"));
  await flush(2000);
  return getCapturedEvents()[0].breadcrumbs ?? [];
};

const fetchUrls = (breadcrumbs: Breadcrumb[]): unknown[] => {
  return breadcrumbs
    .filter((breadcrumb) => breadcrumb.category === "fetch")
    .map((breadcrumb): unknown => breadcrumb.data?.url);
};

test("should send only the query parameters known to be harmless", async () => {
  respondWith.mockReturnValue(new Response("{}", { status: 500 }));

  const breadcrumbs = await recordBreadcrumbs(async () => {
    await fetch("http://localhost/api/group?groupCode=secret&programType=larp");
  });

  expect(fetchUrls(breadcrumbs)).toEqual([
    "http://localhost/api/group?groupCode=[Filtered]&programType=larp",
  ]);
});

test("should filter the Kompassi callback's code and state from navigation", async () => {
  respondWith.mockReturnValue(new Response("{}"));

  const breadcrumbs = await recordBreadcrumbs(async () => {
    history.pushState({}, "", "/auth/kompassi/callback?code=c1&state=s1");
    await Promise.resolve();
  });

  const navigation = breadcrumbs.find((breadcrumb) => {
    return breadcrumb.category === "navigation";
  });
  expect(navigation?.data?.to).toEqual(
    "/auth/kompassi/callback?code=[Filtered]&state=[Filtered]",
  );
});

// The polling loop repeats these every interval
test("should keep a polled request only when it fails", async () => {
  const breadcrumbs = await recordBreadcrumbs(async () => {
    respondWith.mockReturnValue(new Response("{}"));
    await fetch("http://localhost/api/settings");
    await fetch("http://localhost/api/results");
    respondWith.mockReturnValue(new Response("{}", { status: 500 }));
    await fetch("http://localhost/api/settings");
  });

  expect(fetchUrls(breadcrumbs)).toEqual([
    "http://localhost/api/results",
    "http://localhost/api/settings",
  ]);
});
