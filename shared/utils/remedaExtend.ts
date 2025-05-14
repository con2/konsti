// These are functions that are found from lodash but not from remeda

// https://lodash.com/docs/4.17.15#differenceBy
export const differenceBy = <T, U>(
  array: readonly T[],
  values: readonly U[],
  iteratee: (item: T | U) => string | number | symbol,
): T[] => {
  const seen = new Set(values.map((element) => iteratee(element)));
  return array.filter((item) => !seen.has(iteratee(item)));
};
