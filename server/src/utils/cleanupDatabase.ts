import { removeDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { removeProgramItems } from "server/features/program-item/programItemRepository";
import { removeResults } from "server/features/results/resultsRepository";
import { removeSerials } from "server/features/serial/serialRepository";
import { removeSettings } from "server/features/settings/settingsRepository";
import { removeUsers } from "server/features/user/userRepository";
import { removeTestSettings } from "server/test/test-settings/testSettingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

export const cleanupDatabase = async (): Promise<void> => {
  unsafelyUnwrap(await removeUsers());
  unsafelyUnwrap(await removeDirectSignups());
  unsafelyUnwrap(await removeProgramItems());
  unsafelyUnwrap(await removeResults());
  unsafelyUnwrap(await removeSerials());
  unsafelyUnwrap(await removeSettings());
  unsafelyUnwrap(await removeTestSettings());
};
