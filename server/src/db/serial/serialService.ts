import { logger } from 'utils/logger';
import { SerialModel } from 'db/serial/serialSchema';
import { SerialDoc, Serial } from 'typings/serial.typings';
import generator from 'generate-serial-number';

const removeSerials = async (): Promise<void> => {
  logger.info('MongoDB: remove ALL serials from db');
  await SerialModel.deleteMany({});
};

const saveSerials = async (count: number): Promise<SerialDoc[]> => {
  const serialDocs = [] as SerialDoc[];
  // create serials
  for (let i = 1; i <= count; i += 1) {
    const serial: string = generator.generate(10);
    const rawSerials = serialDocs.map((serialDoc) => serialDoc.serial);

    if (
      (await findSerial(serial)) ||
      rawSerials.filter((s) => s === serial).length > 0
    ) {
      i -= 1;
      continue;
    }
    serialDocs.push(
      new SerialModel({
        serial,
      })
    );
    logger.info(`${serial}`);
  }

  let response: SerialDoc[];
  try {
    response = await SerialModel.create(serialDocs);
    logger.info(
      `MongoDB: Serials data saved. (${serialDocs.length} serials saved)`
    );
    return response;
  } catch (error) {
    logger.error(`MongoDB: Error saving serials data - ${error}`);
    return error;
  }
};

const findSerial = async (serial: string): Promise<boolean> => {
  let response;
  try {
    response = await SerialModel.findOne({ serial }).lean<Serial>();
  } catch (error) {
    logger.error(`MongoDB: Error finding serial ${serial} - ${error}`);
    return error;
  }

  if (!response) {
    logger.debug(`MongoDB: Serial "${serial}" not found`);
    return false;
  } else {
    logger.debug(`MongoDB: Found serial "${serial}"`);
    return true;
  }
};

export const serial = { removeSerials, findSerial, saveSerials };
