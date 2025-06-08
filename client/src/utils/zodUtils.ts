import { z } from "zod";

export const StringToJsonSchema = z.string().transform((str, ctx): string => {
  try {
    return JSON.parse(str) as string;
  } catch {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
});
