import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";

interface StartTestServerReturn {
  server: Server;
  mongoServer: MongoMemoryServer;
}

export const startTestServer = async (): Promise<StartTestServerReturn> => {
  const mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  const mongoUri = mongoServer.getUri();
  const module = await import("server/utils/server");
  const server = await module.startServer(mongoUri);

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
