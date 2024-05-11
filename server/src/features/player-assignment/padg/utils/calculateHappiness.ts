import {
  PadgRandomAssignResults,
  Group,
} from "server/types/padgRandomAssignTypes";

export const calculateHappiness = (
  assignment: PadgRandomAssignResults,
  groups: Group[],
): number => {
  let happiness = 0;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!assignment) {
    return 0;
  }

  assignment.forEach((m) => {
    const grpInd = groups.findIndex((p) => p.id === m.id);
    let ind = groups[grpInd].pref.findIndex((ele) => {
      return ele === m.assignment;
    });
    ind = ind + 1;
    if (ind > 0) {
      happiness = happiness + 1 / ind;
    }
  });

  return Math.round(((happiness / groups.length) * 10000) / 100);
};
