import dayjs from "dayjs";

type DateToString<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? DateToString<U>[]
    : T extends object
      ? { [K in keyof T]: DateToString<T[K]> }
      : T;

const _convert = (value: unknown, seen = new WeakSet()): unknown => {
  if (value instanceof Date) {
    return dayjs(value).toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => _convert(item, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      // Prevent infinite recursion on circular reference
      return null;
    }
    seen.add(value);

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = _convert(val, seen);
    }
    return result;
  }

  return value;
};

export const convertDatesToStrings = <T>(input: T): DateToString<T> => {
  return _convert(input) as DateToString<T>;
};
