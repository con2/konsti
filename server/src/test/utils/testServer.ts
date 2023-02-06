import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";

interface StartTestServerReturn {
  server: Server;
  mongoServer: MongoMemoryServer;
}

export const startTestServer = async (): Promise<StartTestServerReturn> => {
  const mongoServer = await MongoMemoryServer.create();
  const module = await import("server/utils/server");
  const server = await module.startServer({
    dbConnString: mongoServer.getUri(),
    enableSentry: false,
  });

  return { server, mongoServer };
};

export const stopTestServer = async (
  server: Server,
  mongoServer: MongoMemoryServer
): Promise<void> => {
  const module = await import("server/utils/server");
  await module.closeServer(server);
  await mongoServer.stop();
};
