// Joins list items with commas but places the given localized conjunction
// (e.g. "and" / "ja") before the last item: "a, b and c"
export const joinWithConjunction = (
  items: readonly string[],
  conjunction: string,
): string => {
  if (items.length <= 1) {
    return items.join("");
  }
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items.slice(-1).join("")}`;
};
