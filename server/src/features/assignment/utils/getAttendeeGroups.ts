import { groupBy } from "lodash-es";
import { User } from "shared/types/models/user";

export const getAttendeeGroups = (
  attendees: readonly User[],
): readonly User[][] => {
  const groupedUsers = groupBy(attendees, "groupCode");

  const attendeesArray: User[][] = [];
  for (const [key, value] of Object.entries(groupedUsers)) {
    if (Array.isArray(value)) {
      if (key === "0") {
        // Loop array and add attendees individually
        for (let i = 0; i < value.length; i++) {
          attendeesArray.push([value[i]]);
        }
      } else {
        attendeesArray.push(value);
      }
    }
  }

  return attendeesArray;
};
