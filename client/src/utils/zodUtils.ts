import { z } from "zod";

export const StringToJsonSchema = z.string().transform((str, ctx): string => {
  try {
    return JSON.parse(str);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
});
