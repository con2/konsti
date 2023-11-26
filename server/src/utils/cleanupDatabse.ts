import { removeGames } from "server/features/game/gameRepository";
import { removeResults } from "server/features/results/resultsRepository";
import { removeSerials } from "server/features/serial/serialRepository";
import { removeSettings } from "server/features/settings/settingsRepository";
import { removeSignups } from "server/features/signup/signupRepository";
import { removeUsers } from "server/features/user/userRepository";
import { removeTestSettings } from "server/test/test-settings/testSettingsRepository";

export const cleanupDatabase = async (): Promise<void> => {
  await removeUsers();
  await removeSignups();
  await removeGames();
  await removeResults();
  await removeSerials();
  await removeSettings();
  await removeTestSettings();
};
