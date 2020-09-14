import fs from 'fs';
import _ from 'lodash';
import prettier from 'prettier';
import { logger } from 'utils/logger';

export const readJson = <T>(
  year: number,
  event: string,
  datatype: string
): T[] => {
  const data = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/${datatype}.json`,
      'utf8'
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
  if (!fs.existsSync(`src/statistics/datafiles/${event}/${year}/temp/`)) {
    fs.mkdirSync(`src/statistics/datafiles/${event}/${year}/temp/`);
  }

  fs.writeFileSync(
    `src/statistics/datafiles/${event}/${year}/temp/${datatype}-fixed.json`,
    prettier.format(JSON.stringify(data), { parser: 'json' }),
    'utf8'
  );

  logger.info(
    `Saved ${getDataLength(
      data
    )} ${datatype} to file src/statistics/datafiles/${event}/${year}/temp/${datatype}-fixed.json`
  );
};

export const toPercent = (num: number): number => {
  return Math.round(num * 100);
};

const getDataLength = <T>(data: T[] | Object): number => {
  if (Array.isArray(data)) {
    return data.length;
  } else {
    return _.size(data);
  }
};
