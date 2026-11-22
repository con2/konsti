import { getIsolationScope, withIsolationScope } from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import { expect, test, vi } from "vitest";
import { UserGroup } from "shared/types/models/user";
import { requireAuth } from "server/middleware/requireAuth";
import { authorizedAs } from "server/test/utils/authorizedAs";

test("should set the authenticated account as the Sentry user", () => {
  const request = {
    headers: {
      authorization: authorizedAs(UserGroup.USER, "test1").Authorization,
    },
  } as Request;
  const next: NextFunction = vi.fn();

  withIsolationScope(() => {
    requireAuth(UserGroup.USER)(request, {} as Response, next);

    expect(getIsolationScope().getUser()).toEqual({ username: "test1" });
  });
  expect(next).toHaveBeenCalledOnce();
});
