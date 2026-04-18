import { MongoMemoryServer } from "mongodb-memory-server";

const mongoDbVersion = "8.0.20";
export const mongoDbPort = 57233;

let mongoDb: MongoMemoryServer;

export const setup = async (): Promise<void> => {
  process.env.MONGOMS_VERSION = mongoDbVersion;
  mongoDb = await MongoMemoryServer.create({ instance: { port: mongoDbPort } }); // mongodb://127.0.0.1:57233/
};

export const teardown = async (): Promise<void> => {
  await mongoDb.stop();
};
