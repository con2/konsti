import { vi } from "vitest";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";

initializeDayjs();

if (!config.server().enableLoggingInTests) {
  // Don't show logging in tests
  vi.doMock("server/utils/logger", () => {
    return {
      logger: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        info: vi.fn().mockImplementation(() => {}),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        debug: vi.fn().mockImplementation(() => {}),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        warn: vi.fn().mockImplementation(() => {}),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        error: vi.fn().mockImplementation(() => {}),
      },
    };
  });
}

// Defined in globalSetup.ts
globalThis.__MONGO_URI__ = "mongodb://127.0.0.1:57233/";

vi.spyOn(config, "shared").mockReturnValue({
  ...config.shared(),
  conventionStartTime: "2023-07-28T12:00:00Z", // Fri 15:00 GMT+3
  directSignupAlwaysOpenIds: ["1234"],
  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],
});
