import z from "zod";
import { partition } from "remeda";
import { logger } from "server/utils/logger";

export const safeEnumArray = <T extends Record<string, string>>(
  enumType: T,
  label: string,
  fallback: T[keyof T][] = [],
): z.ZodCatch<z.ZodArray<z.ZodEnum<T>>> => {
  return z.array(z.enum(enumType)).catch((ctx) => {
    if (!Array.isArray(ctx.value)) {
      return fallback;
    }
    const [valid, invalid] = partition(ctx.value as string[], (val) =>
      Object.values(enumType).includes(val),
    );
    if (invalid.length > 0) {
      logger.error(
        "%s",
        new Error(`Invalid ${label}: ${JSON.stringify(invalid)}`),
      );
    }
    return valid as T[keyof T][];
  });
};
