export interface UserDirectSignup {
  username: string;
  priority: number;
  signedToStartTime: string;
  message: string;
}

export interface DirectSignupsForProgramItem {
  programItemId: string;
  userSignups: readonly UserDirectSignup[];
  count: number;
}

export interface SignupRepositoryAddSignup {
  username: string;
  directSignupProgramItemId: string;
  message: string;
  priority: number;
  signedToStartTime: string;
}

export interface SignupRepositoryAddSignupResponse {
  modifiedCount: number;
  droppedSignups: SignupRepositoryAddSignup[];
}
