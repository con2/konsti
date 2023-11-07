import fs from "fs";
import _ from "lodash";
import prettier from "prettier";
import { config } from "shared/config";
import { logger } from "server/utils/logger";

export const readJson = <T>(
  year: number,
  event: string,
  datatype: string,
): T[] => {
  const data = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/${datatype}.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${data.length} ${datatype}`);
  return data;
};

export const writeJson = async <T>(
  year: number,
  event: string,
  datatype: string,
  data: T[] | Object,
): Promise<void> => {
  if (
    !fs.existsSync(`${config.server().statsDataDir}/${event}/${year}/temp/`)
  ) {
    fs.mkdirSync(`${config.server().statsDataDir}/${event}/${year}/temp/`);
  }

  fs.writeFileSync(
    `${
      config.server().statsDataDir
    }/${event}/${year}/temp/${datatype}-fixed.json`,
    // eslint-disable-next-line no-restricted-syntax -- TODO: Fix, format() ban should only apply to dayjs().format()
    await prettier.format(JSON.stringify(data), { parser: "json" }),
    "utf8",
  );

  logger.info(
    `Saved ${getDataLength(data)} ${datatype} to file ${
      config.server().statsDataDir
    }/${event}/${year}/temp/${datatype}-fixed.json`,
  );
};

export interface Message {
  feedback: string;
  game: string;
  organizer: string;
  startTime: string;
  programType: string;
}

export const writeFeedback = (
  year: number,
  event: string,
  datatype: string,
  data: Record<string, Message[]>,
): void => {
  if (
    !fs.existsSync(`${config.server().statsDataDir}/${event}/${year}/temp/`)
  ) {
    fs.mkdirSync(`${config.server().statsDataDir}/${event}/${year}/temp/`);
  }

  Object.entries(data).map(([host, messages], index) => {
    const descriptions = messages.map((message, i) => {
      return `${i + 1}) ${message.game} (${message.startTime})\n\n${
        message.feedback
      }\n\n`;
    });

    const formattedFeedback = `${host}\n\n${descriptions.join(
      "",
    )}**********\n\n`;

    if (index === 0) {
      fs.writeFileSync(
        `${
          config.server().statsDataDir
        }/${event}/${year}/temp/${datatype}-fixed.txt`,
        `**********\n\n${formattedFeedback}`,
        "utf8",
      );
      return;
    }

    fs.appendFileSync(
      `${
        config.server().statsDataDir
      }/${event}/${year}/temp/${datatype}-fixed.txt`,
      formattedFeedback,
      "utf8",
    );
  });

  logger.info(
    `Saved ${getDataLength(data)} ${datatype} to file ${
      config.server().statsDataDir
    }/${event}/${year}/temp/${datatype}-fixed.txt`,
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
