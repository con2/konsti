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

export const formatJson = async (
  event: string,
  year: number,
): Promise<void> => {
  for (const datatype of datatypes) {
    if (!jsonFileExists(event, year, datatype)) continue;
    const data = readJson<unknown>(event, year, datatype);
    await writeJson(event, year, datatype, data);
  }
};
