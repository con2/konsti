import { z } from "zod";
import {
  TestSettings,
  TestSettingsSchema,
} from "shared/test-types/models/testSettings";
import { ApiResult } from "shared/typings/api/errors";

export const PostTestSettingsRequestSchema = TestSettingsSchema.partial();

export type PostTestSettingsRequest = z.infer<
  typeof PostTestSettingsRequestSchema
>;

export interface PostTestSettingsResponse extends ApiResult {
  testSettings: TestSettings;
}

export interface GetTestSettingsResponse extends ApiResult {
  testSettings: TestSettings;
}
