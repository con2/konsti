import { testProgramItem } from "shared/tests/testProgramItem";
import { UserAssignmentResult } from "shared/types/models/result";

export const mockResults: UserAssignmentResult[] = [
  {
    username: "Test User",
    directSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: " 2019-07-26 14:00:00.000Z",
      message: "",
    },
  },
];
