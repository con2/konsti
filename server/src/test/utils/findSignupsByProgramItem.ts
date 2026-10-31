import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

// Every stored direct sign-up keyed by program item, read once for checking a run's outcome
export const findSignupsByProgramItem = async (): Promise<
  Map<string, DirectSignupsForProgramItem>
> => {
  const directSignups = unsafelyUnwrap(await findDirectSignups());
  return new Map(
    directSignups.map((signups) => [signups.programItemId, signups]),
  );
};
