import { groupBy } from "lodash-es";
import { User } from "shared/types/models/user";

export const getAttendeeGroups = (
  attendees: readonly User[],
): readonly User[][] => {
  const groupedUsers = groupBy(attendees, "groupCode");

  const attendeesArray: User[][] = [];
  for (const [groupCode, users] of Object.entries(groupedUsers)) {
    if (Array.isArray(users)) {
      if (groupCode === "0") {
        // Loop array and add attendees individually
        for (const user of users) {
          attendeesArray.push([user]);
        }
      } else {
        attendeesArray.push(users);
      }
    }
  }

  return attendeesArray;
};
