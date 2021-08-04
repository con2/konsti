import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
} from 'shared/constants/validation';

export const passwordLength = (value: string): string | undefined => {
  if (value.length < PASSWORD_LENGTH_MIN) return 'validation.tooShort';
  if (value.length > PASSWORD_LENGTH_MAX) return 'validation.tooLong';
};
