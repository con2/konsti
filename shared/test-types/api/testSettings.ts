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

export interface PostTestSettingsResponse extends ApiResult {
  testSettings: TestSettings;
}

export interface PostTestSettingsError extends ApiError {
  errorId: "unknown";
}

// GET test settings

export interface GetTestSettingsResponse extends ApiResult {
  testSettings: TestSettings;
}

export interface GetTestSettingsError extends ApiError {
  errorId: "unknown";
}
