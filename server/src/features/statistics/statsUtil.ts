import fs from "node:fs";
import prettier from "prettier";
import { config } from "shared/config";
import { logger } from "server/utils/logger";

export const readJson = <T>(
  year: number,
  event: string,
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
  year: number,
  event: string,
  datatype: string,
  data: unknown[],
): Promise<void> => {
  if (!fs.existsSync(`${config.server().statsDataDir}/${event}/${year}`)) {
    fs.mkdirSync(`${config.server().statsDataDir}/${event}/${year}`);
  }

  fs.writeFileSync(
    `${config.server().statsDataDir}/${event}/${year}/${datatype}.json`,
    // eslint-disable-next-line no-restricted-syntax -- TODO: Fix, format() ban should only apply to dayjs().format()
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
