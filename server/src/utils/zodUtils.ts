import z from "zod";
import { partition } from "remeda";
import { logger } from "server/utils/logger";

export const safeEnumArray = <T extends Record<string, string>>(
  enumType: T,
  label: string,
  fallback: T[keyof T][] = [],
): z.ZodCatch<z.ZodArray<z.ZodNativeEnum<T>>> => {
  // eslint-disable-next-line unicorn/catch-error-name
  return z.array(z.nativeEnum(enumType)).catch((ctx) => {
    if (!Array.isArray(ctx.input)) {
      return fallback;
    }
    const [valid, invalid] = partition(ctx.input, (val) =>
      Object.values(enumType).includes(val),
    );
    if (invalid.length > 0) {
      logger.error(
        "%s",
        new Error(`Invalid ${label}: ${JSON.stringify(invalid)}`),
      );
    }
    return valid;
  });
};
