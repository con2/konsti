export interface UserDirectSignup {
  userId: string;
  priority: number;
  signedToStartTime: string;
  signupTime: string;
  message: string;
}

export interface DirectSignupsForProgramItem {
  programItemId: string;
  userSignups: readonly UserDirectSignup[];
  count: number;
}

export interface SignupRepositoryAddSignup {
  userId: string;
  directSignupProgramItemId: string;
  message: string;
  priority: number;
  signedToStartTime: string;
  signupTime: string;
}

export interface SignupRepositoryAddSignupResponse {
  modifiedCount: number;
  droppedSignups: SignupRepositoryAddSignup[];
}
