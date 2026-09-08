import { groupBy } from "remeda";
import { User } from "shared/types/models/user";

export const getAttendeeGroups = (
  attendees: readonly User[],
): readonly User[][] => {
  const groupedUsers = groupBy(attendees, (attendee) => attendee.groupCode);

  const attendeesArray: User[][] = [];
  for (const [groupCode, users] of Object.entries(groupedUsers)) {
    if (Array.isArray(users)) {
      if (groupCode === "0") {
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
