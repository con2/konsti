import { concurrently } from "concurrently";

export const populateDb = async (testName: string): Promise<void> => {
  const { result } = concurrently([
    {
      command: "yarn:populate-db:dummy",
      env: { DB_NAME: `test-${testName}` },
    },
  ]);

  try {
    await result;
  } catch (error) {
    throw Error(`Populating DB failed for ${testName}`);
  }
};

export const startServer = async (
  testName: string,
  port: number
): Promise<void> => {
  const { result } = concurrently([
    {
      command: "yarn:start",
      env: {
        DB_NAME: `test-${testName}`,
        PORT: port,
        NODE_ENV: "development",
      },
    },
  ]);

  try {
    await result;
  } catch (error) {
    throw Error(`Starting server failed for ${testName}`);
  }
};
