import { z } from "zod";
import {
  TestSettings,
  TestSettingsSchema,
} from "shared/test-types/models/testSettings";
import { ApiError, ApiResult } from "shared/types/api/errors";

// POST test settings

export const PostTestSettingsRequestSchema = TestSettingsSchema.partial();

export type PostTestSettingsRequest = z.infer<
  typeof PostTestSettingsRequestSchema
>;

interface PostTestSettingsResult extends ApiResult {
  testSettings: TestSettings;
}

interface PostTestSettingsError extends ApiError {
  errorId: "unknown";
}

export type PostTestSettingsResponse =
  | PostTestSettingsResult
  | PostTestSettingsError;

// GET test settings

interface GetTestSettingsResult extends ApiResult {
  testSettings: TestSettings;
}

interface GetTestSettingsError extends ApiError {
  errorId: "unknown";
}

export type GetTestSettingsResponse =
  | GetTestSettingsResult
  | GetTestSettingsError;
