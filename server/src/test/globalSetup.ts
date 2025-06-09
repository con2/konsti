import { MongoMemoryServer } from "mongodb-memory-server";

let mongoDb: MongoMemoryServer;

// eslint-disable-next-line import/no-unused-modules
export const setup = async (): Promise<void> => {
  process.env.MONGOMS_VERSION = "8.0.9";
  mongoDb = await MongoMemoryServer.create({ instance: { port: 57233 } }); // mongodb://127.0.0.1:57233/
};

// eslint-disable-next-line import/no-unused-modules
export const teardown = async (): Promise<void> => {
  await mongoDb.stop();
};
