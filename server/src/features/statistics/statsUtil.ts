import fs from "node:fs";
import prettier from "prettier";
import { config } from "shared/config";
import { logger } from "server/utils/logger";

// Not every event has every file, e.g. direct-sign-up-only events have no
// results.json and the oldest dumps lack settings.json and serials.json
export const jsonFileExists = (
  event: string,
  year: number,
  datatype: string,
): boolean =>
  fs.existsSync(
    `${config.server().statsDataDir}/${event}/${year}/${datatype}.json`,
  );

export const readJson = <T>(
  event: string,
  year: number,
  datatype: string,
): T[] => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/${datatype}.json`,
      "utf8",
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  logger.info(`Loaded ${data.length} ${datatype}`);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data;
};

export const writeJson = async (
  event: string,
  year: number,
  datatype: string,
  data: unknown[],
): Promise<void> => {
  if (!fs.existsSync(`${config.server().statsDataDir}/${event}/${year}`)) {
    fs.mkdirSync(`${config.server().statsDataDir}/${event}/${year}`);
  }

  fs.writeFileSync(
    `${config.server().statsDataDir}/${event}/${year}/${datatype}.json`,
    await prettier.format(JSON.stringify(data), { parser: "json" }),
    "utf8",
  );

  logger.info(
    `Saved ${data.length} ${datatype} to file ${
      config.server().statsDataDir
    }/${event}/${year}/${datatype}.json`,
  );
};

export const toPercent = (num: number): number => {
  return Math.round(num * 100);
};
