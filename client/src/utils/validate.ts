export const required = (value: string): string | undefined => {
  if (!value) return 'validation.required';
};
