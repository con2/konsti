import { Request, Response } from "express";
import { runGenerators } from "server/test/test-data-generation/runGenerators";
import {
  PopulateDbOptions,
  PostAddSerialsRequest,
} from "shared/test-types/api/testData";
import { cleanupDatabase } from "server/utils/cleanupDatabase";
import { ProgramItem } from "shared/types/models/programItem";
import { saveSerials } from "server/features/serial/serialRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { saveProgramItems } from "server/features/program-item/programItemRepository";

export const postPopulateDb = async (
  req: Request<unknown, unknown, PopulateDbOptions>,
  res: Response,
): Promise<Response> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Data creation not allowed in production");
  }

  const {
    clean,
    users,
    admin,
    programItems,
    lotterySignups,
    directSignups,
    eventLog,
  } = req.body;

  await runGenerators(
    {
      clean,
      users,
      admin,
      programItems,
      lotterySignups,
      directSignups,
      eventLog,
    },
    { closeDb: false },
  );

  return res.sendStatus(200);
};

export const postClearDb = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Data creation not allowed in production");
  }

  await cleanupDatabase();
  return res.sendStatus(200);
};

export const postAddProgramItems = async (
  req: Request<unknown, unknown, ProgramItem[]>,
  res: Response,
): Promise<Response> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Data creation not allowed in production");
  }

  await saveProgramItems(req.body);

  return res.sendStatus(200);
};

export const postAddSerials = async (
  req: Request<unknown, unknown, PostAddSerialsRequest>,
  res: Response,
): Promise<Response> => {
  // Gate on SETTINGS, not NODE_ENV: this endpoint is exposed in staging, where
  // the pod runs with NODE_ENV=production and only SETTINGS differs
  if (process.env.SETTINGS === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Data creation not allowed in production");
  }

  const serials = unsafelyUnwrap(await saveSerials(req.body.count));

  return res.json({
    message: "Serials generated",
    status: "success",
    serials: serials.map((serial) => serial.serial),
  });
};
