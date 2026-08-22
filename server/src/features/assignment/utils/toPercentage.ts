// Renders a share for a human-readable assignment summary. A zero total is a real outcome
// - nobody left to place, or no program items with lottery sign-ups - and reads better as
// 0% than as the NaN% a plain division would produce
export const toPercentage = (part: number, total: number): string =>
  total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
