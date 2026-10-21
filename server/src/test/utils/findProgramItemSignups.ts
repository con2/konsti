import { findDirectSignupsByProgramItemIds } from "server/features/direct-signup/directSignupRepository";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

// The stored sign-ups of one program item, for reading a run's outcome back
export const findProgramItemSignups = async (
  programItemId: string,
): Promise<DirectSignupsForProgramItem | undefined> => {
  const [directSignups] = unsafelyUnwrap(
    await findDirectSignupsByProgramItemIds([programItemId]),
  );
  return directSignups;
};
