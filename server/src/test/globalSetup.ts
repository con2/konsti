import { MongoMemoryServer } from "mongodb-memory-server";

let mongoDb: MongoMemoryServer;

export const setup = async (): Promise<void> => {
  process.env.MONGOMS_VERSION = "7.0.12";
  mongoDb = await MongoMemoryServer.create({ instance: { port: 57233 } }); // mongodb://127.0.0.1:57233/
};

export const teardown = async (): Promise<void> => {
  await mongoDb.stop();
};
