import { z } from "zod";
import {
  TestSettings,
  TestSettingsSchema,
} from "shared/test-typings/models/testSettings";

export const PostTestSettingsRequestSchema = TestSettingsSchema.partial();

export type PostTestSettingsRequest = z.infer<
  typeof PostTestSettingsRequestSchema
>;

export interface PostTestSettingsResponse {
  testSettings: TestSettings;
  message: string;
  status: "success";
}

export interface GetTestSettingsResponse {
  testSettings: TestSettings;
  message: string;
  status: "success";
}
