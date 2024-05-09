import { testProgramItem } from "shared/tests/testProgramItem";
import { AssignmentResult } from "shared/types/models/result";

export const mockResults: AssignmentResult[] = [
  {
    username: "Test User",
    directSignup: {
      programItemDetails: testProgramItem,
      priority: 1,
      time: " 2019-07-26 14:00:00.000Z",
      message: "",
    },
  },
];
