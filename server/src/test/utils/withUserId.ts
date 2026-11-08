import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import { getUserId } from "server/test/utils/getUserId";

export type DirectSignupFixture = Omit<SignupRepositoryAddSignup, "userId">;

export const withUserId = async (
  signup: DirectSignupFixture,
): Promise<SignupRepositoryAddSignup> => {
  return { ...signup, userId: await getUserId(signup.username) };
};

export const withUserIds = async (
  signups: readonly DirectSignupFixture[],
): Promise<SignupRepositoryAddSignup[]> => {
  return Promise.all(signups.map(withUserId));
};
