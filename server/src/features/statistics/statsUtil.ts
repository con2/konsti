import fs from "node:fs";
import { size } from "lodash-es";
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
  programItem: string;
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
      return `${i + 1}) ${message.programItem} (${message.startTime})\n\n${
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

const getDataLength = (data: unknown[] | Record<string, Message[]>): number => {
  if (Array.isArray(data)) {
    return data.length;
  }
  return size(data);
};
