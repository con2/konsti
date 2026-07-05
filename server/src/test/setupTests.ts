import { EventEmitter } from "node:events";
import { vi } from "vitest";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";
import { RemoveLotterySignupsStrategy } from "shared/config/eventConfigTypes";
import { mongoDbPort } from "server/test/globalSetup";

initializeDayjs();

// Increase the max listeners limit to prevent MongoDB connection warnings during tests
EventEmitter.defaultMaxListeners = 30;

if (!config.server().enableLoggingInTests) {
  // Don't show logging in tests
  vi.doMock("server/utils/logger", () => {
    return {
      logger: {
        info: vi.fn().mockImplementation(() => null),
        debug: vi.fn().mockImplementation(() => null),
        warn: vi.fn().mockImplementation(() => null),
        error: vi.fn().mockImplementation(() => null),
      },
    };
  });
}

// Defined in globalSetup.ts
Object.defineProperty(globalThis, "__MONGO_URI__", {
  value: `mongodb://127.0.0.1:${mongoDbPort}/`,
  writable: true,
  configurable: true,
});

vi.spyOn(config, "event").mockReturnValue({
  ...config.event(),
  eventStartTime: "2023-07-28T12:00:00Z", // Fri 15:00 GMT+3
  directSignupAlwaysOpenIds: ["1234"],
  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],
  removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.OVERLAP,
});
