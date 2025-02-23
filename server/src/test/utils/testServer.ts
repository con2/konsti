import { Server } from "node:http";
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
interface StartTestServerReturn {
  server: Server;
}

export const startTestServer = async (
  dbConnString: string,
): Promise<StartTestServerReturn> => {
  const module = await import("server/utils/server");
  const server = await module.startServer({
    dbConnString,

    dbName: faker.string.alphanumeric(10),
  });

  return { server };
};

export const stopTestServer = async (server: Server): Promise<void> => {
  const module = await import("server/utils/server");
  // Delete mongoose models because vi.resetModules() doesn't handle it correctly
  for (const model of Object.keys(mongoose.models)) {
    mongoose.deleteModel(model);
  }
  await module.closeServer(server);
};
