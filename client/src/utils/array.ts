export const moveArrayItem = <T>(
  arr: readonly T[],
  from: number,
  to: number
): readonly T[] => {
  return arr.reduce((prev: T[], current, index, self) => {
    if (from === to) {
      prev.push(current);
    }
    if (index === from) {
      return prev;
    }
    if (from < to) {
      prev.push(current);
    }
    if (index === to) {
      prev.push(self[from]);
    }
    if (from > to) {
      prev.push(current);
    }
    return prev;
  }, []);
};

export const insertByIndex = <T>(
  arr: readonly T[],
  newItem: T,
  insertAt: number
): readonly T[] => [...arr.slice(0, insertAt), newItem, ...arr.slice(insertAt)];
