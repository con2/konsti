import {
  jsonFileExists,
  readJson,
  writeJson,
} from "server/features/statistics/statsUtil";

const datatypes = [
  "users",
  "results",
  "program-items",
  "direct-signups",
  "settings",
  "serials",
];

const cleanValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanValue(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    // Unwrap MongoDB extended JSON timestamps: { "$date": "..." } -> "..."
    if (Object.keys(record).length === 1 && typeof record.$date === "string") {
      return record.$date;
    }

    return Object.fromEntries(
      Object.entries(record)
        .filter(([key]) => key !== "_id" && key !== "__v")
        .map(([key, nestedValue]) => [key, cleanValue(nestedValue)]),
    );
  }

  return value;
};

export const formatFields = async (
  event: string,
  year: number,
): Promise<void> => {
  for (const datatype of datatypes) {
    if (!jsonFileExists(event, year, datatype)) continue;
    const data = readJson<unknown>(event, year, datatype);
    const cleanedData = data.map((item) => cleanValue(item));
    await writeJson(event, year, datatype, cleanedData);
  }
};
