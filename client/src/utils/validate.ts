import { PASSWORD_LENGTH, USERNAME_LENGTH } from 'shared/constants/validation';

export const required = (value: string): string | undefined => {
  if (!value) return 'validation.required';
};

export const usernameMaxLength = (value: string): string | undefined => {
  if (value.length > USERNAME_LENGTH) return 'validation.tooLong';
};

export const passwordMaxLength = (value: string): string | undefined => {
  if (value.length > PASSWORD_LENGTH) return 'validation.tooLong';
};
