export const isEnumValue = <T extends Record<string, string>>(
  enumObject: T,
  value: string,
): value is T[keyof T] => {
  const values: readonly string[] = Object.values(enumObject);
  return values.includes(value);
};
