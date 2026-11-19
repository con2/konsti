import { MongoMemoryServer } from "mongodb-memory-server";
import { mongoDbVersion } from "server/test/mongoDbVersion";

// Each mutation testing worker runs its own vitest, so each needs its own port, starting one
// past the port an ordinary test run uses
const mutationWorker = process.env.STRYKER_MUTATOR_WORKER;
export const mongoDbPort =
  47233 + (mutationWorker === undefined ? 0 : 1 + Number(mutationWorker));

let mongoDb: MongoMemoryServer;

export const setup = async (): Promise<void> => {
  process.env.MONGOMS_VERSION = mongoDbVersion;
  mongoDb = await MongoMemoryServer.create({ instance: { port: mongoDbPort } });
};

export const teardown = async (): Promise<void> => {
  await mongoDb.stop();
};
