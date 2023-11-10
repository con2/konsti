import { MongoMemoryServer } from "mongodb-memory-server";

interface Options {
  serverOptions?: NonNullable<
    Parameters<(typeof MongoMemoryServer)["create"]>[0]
  >;
}

export const setupMongoDbMemoryServer = async (
  options?: Options,
): Promise<void> => {
  const serverOptions = options?.serverOptions;
  globalThis.__MONGO_DB__ = await MongoMemoryServer.create(serverOptions);
  globalThis.__MONGO_URI__ = globalThis.__MONGO_DB__.getUri();
};

export const teardownMongoDbMemoryServer = async (): Promise<void> => {
  await globalThis.__MONGO_DB__.stop();
};
