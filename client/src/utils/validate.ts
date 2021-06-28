import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from 'shared/constants/validation';

export const required = (value: string): string | undefined => {
  if (!value) return 'validation.required';
};

export const usernameLength = (value: string): string | undefined => {
  if (value.length < USERNAME_LENGTH_MIN) return 'validation.tooShort';
  if (value.length > USERNAME_LENGTH_MAX) return 'validation.tooLong';
};

export const passwordLength = (value: string): string | undefined => {
  if (value.length < PASSWORD_LENGTH_MIN) return 'validation.tooShort';
  if (value.length > PASSWORD_LENGTH_MAX) return 'validation.tooLong';
};
