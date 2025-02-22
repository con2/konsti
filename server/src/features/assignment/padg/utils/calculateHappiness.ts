import {
  PadgRandomAssignResult,
  Group,
} from "server/types/padgRandomAssignTypes";

export const calculateHappiness = (
  assignResults: PadgRandomAssignResult[],
  groups: Group[],
): number => {
  let happiness = 0;

  for (const assignResult of assignResults) {
    const groupIndex = groups.findIndex(
      (group) => group.id === assignResult.id,
    );
    let index = groups[groupIndex].pref.indexOf(assignResult.assignment);
    index = index + 1;
    if (index > 0) {
      happiness = happiness + 1 / index;
    }
  }

  return Math.round(((happiness / groups.length) * 10000) / 100);
};
