import { testGame } from "shared/tests/testGame";
import { AssignmentResult } from "shared/types/models/result";

export const mockResults: AssignmentResult[] = [
  {
    username: "Test User",
    directSignup: {
      gameDetails: testGame,
      priority: 1,
      time: " 2019-07-26 14:00:00.000Z",
      message: "",
    },
  },
];
