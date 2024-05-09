import { removeGames } from "server/features/program-item/programItemRepository";
import { removeResults } from "server/features/results/resultsRepository";
import { removeSerials } from "server/features/serial/serialRepository";
import { removeSettings } from "server/features/settings/settingsRepository";
import { removeDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { removeUsers } from "server/features/user/userRepository";
import { removeTestSettings } from "server/test/test-settings/testSettingsRepository";

export const cleanupDatabase = async (): Promise<void> => {
  await removeUsers();
  await removeDirectSignups();
  await removeGames();
  await removeResults();
  await removeSerials();
  await removeSettings();
  await removeTestSettings();
};
