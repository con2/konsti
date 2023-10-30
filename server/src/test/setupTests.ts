import { vi } from "vitest";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { config } from "shared/config";
import { ProgramType } from "shared/typings/models/game";

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
  directSignupAlwaysOpenIds: ["1234"],
  directSignupProgramTypes: [ProgramType.TOURNAMENT, ProgramType.WORKSHOP],
  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],
});
