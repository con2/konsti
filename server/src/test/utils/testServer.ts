import { Server } from "http";
import { faker } from "@faker-js/faker";

interface StartTestServerReturn {
  server: Server;
}

export const startTestServer = async (
  dbConnString: string
): Promise<StartTestServerReturn> => {
  const module = await import("server/utils/server");
  const server = await module.startServer({
    dbConnString,
    enableSentry: false,
    dbName: faker.random.alphaNumeric(10),
  });

  return { server };
};

export const stopTestServer = async (server: Server): Promise<void> => {
  const module = await import("server/utils/server");
  await module.closeServer(server);
};
