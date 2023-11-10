import { afterAll, beforeAll, vi } from "vitest";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { config } from "shared/config";
import { ProgramType } from "shared/typings/models/game";
import {
  setupMongoDbMemoryServer,
  teardownMongoDbMemoryServer,
} from "server/test/mongoDdMemoryServerSetup";

initializeDayjs();

if (!config.server().enableLoggingInTests) {
  // Don't show logging in tests
  vi.doMock("server/utils/logger", () => {
    return {
      logger: {
        info: vi.fn().mockImplementation(() => {}),
        debug: vi.fn().mockImplementation(() => {}),
        warn: vi.fn().mockImplementation(() => {}),
        error: vi.fn().mockImplementation(() => {}),
      },
    };
  });
}

process.env.MONGOMS_VERSION = "6.0.10";

vi.spyOn(config, "shared").mockReturnValue({
  ...config.shared(),
  conventionStartTime: "2023-07-28T12:00:00Z", // Fri 15:00 GMT+3
  conventionEndTime: "2023-07-30T21:00:00Z", // Sun 24:00 GMT+3
  directSignupAlwaysOpenIds: ["1234"],
  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],
});

beforeAll(async () => {
  await setupMongoDbMemoryServer();
});

afterAll(async () => {
  await teardownMongoDbMemoryServer();
});
