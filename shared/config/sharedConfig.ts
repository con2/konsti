import {
  AssignmentStrategy,
  SharedConfig,
  SignupStrategy,
  ConventionType,
} from './sharedConfig.types';

export const sharedConfig: SharedConfig = {
  // App info
  appName: 'Konsti',

  // Convention settings
  signupStrategy: SignupStrategy.DIRECT,
  conventionType: ConventionType.REMOTE,
  assignmentStrategy: AssignmentStrategy.GROUP_PADG,
  enableGroups: false,
};
