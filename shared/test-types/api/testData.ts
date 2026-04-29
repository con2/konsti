import { z } from "zod";
import { ProgramItemSchema } from "shared/types/models/programItem";
import { EmailNotificationTrigger } from "shared/types/emailNotification";

// POST test settings

export const PopulateDbOptionsSchema = z.object({
  clean: z.boolean().optional(),
  users: z.boolean().optional(),
  admin: z.boolean().optional(),
  programItems: z.boolean().optional(),
  lotterySignups: z.boolean().optional(),
  directSignups: z.boolean().optional(),
  eventLog: z.boolean().optional(),
});

export type PopulateDbOptions = z.infer<typeof PopulateDbOptionsSchema>;

// POST test program item

export const PostAddProgramItemsRequestSchema = z.array(ProgramItemSchema);

// POST test serial

export const PostAddSerialsRequestSchema = z.object({ count: z.number() });

export type PostAddSerialsRequest = z.infer<typeof PostAddSerialsRequestSchema>;

// POST test email

export const PostEmailTestRequestSchema = z.object({
  email: z.email(),
  notificationType: z.enum(EmailNotificationTrigger),
  programId: z.string().min(1, "Program ID is required"),
});

export type PostEmailTestRequest = z.infer<typeof PostEmailTestRequestSchema>;
