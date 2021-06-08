import { Server } from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { closeServer } from 'server/utils/closeServer';

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
  await closeServer(server);
  await mongoServer.stop();
};
