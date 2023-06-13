import fs from "fs";
import _ from "lodash";
import prettier from "prettier";
import { config } from "server/config";
import { logger } from "server/utils/logger";

export const readJson = <T>(
  year: number,
  event: string,
  datatype: string
): T[] => {
  const data = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/${datatype}.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${data.length} ${datatype}`);
  return data;
};

export const writeJson = <T>(
  year: number,
  event: string,
  datatype: string,
  data: T[] | Object
): void => {
  if (!fs.existsSync(`${config.statsDataDir}/${event}/${year}/temp/`)) {
    fs.mkdirSync(`${config.statsDataDir}/${event}/${year}/temp/`);
  }

  fs.writeFileSync(
    `${config.statsDataDir}/${event}/${year}/temp/${datatype}-fixed.json`,
    prettier.format(JSON.stringify(data), { parser: "json" }),
    "utf8"
  );

  logger.info(
    `Saved ${getDataLength(data)} ${datatype} to file ${
      config.statsDataDir
    }/${event}/${year}/temp/${datatype}-fixed.json`
  );
};

export const toPercent = (num: number): number => {
  return Math.round(num * 100);
};

const getDataLength = <T>(data: T[] | Object): number => {
  if (Array.isArray(data)) {
    return data.length;
  }
  return _.size(data);
};
