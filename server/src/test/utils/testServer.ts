import { Server } from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';

interface StartTestServerReturn {
  server: Server;
  mongoServer: MongoMemoryServer;
}

export const startTestServer = async (): Promise<StartTestServerReturn> => {
  const mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  const module = await import('server/utils/startServer');
  const server = await module.startServer(mongoUri);

  return { server, mongoServer };
};

export const stopTestServer = async (
  server: Server,
  mongoServer: MongoMemoryServer
): Promise<void> => {
  const module = await import('server/utils/closeServer');
  await module.closeServer(server);
  await mongoServer.stop();
};
