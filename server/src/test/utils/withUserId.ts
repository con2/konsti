import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { getUserId } from "server/test/utils/getUserId";

export type DirectSignupFixture = Omit<SignupRepositoryAddSignup, "userId"> & {
  username: string;
};

export const withUserId = async (
  signup: DirectSignupFixture,
): Promise<SignupRepositoryAddSignup> => {
  const { username, ...rest } = signup;
  return { ...rest, userId: await getUserId(username) };
};

export const withUserIds = async (
  signups: readonly DirectSignupFixture[],
): Promise<SignupRepositoryAddSignup[]> => {
  return Promise.all(signups.map(withUserId));
};
