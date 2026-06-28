import { expect, test, vi } from "vitest";
import { runPadgAssignment } from "server/features/assignment/padg/utils/runPadgAssignment";
import { getUsers } from "server/features/assignment/utils/assignmentTestUtils";
import { testProgramItem } from "shared/tests/testProgramItem";

// Every round returns a non-array (failed) result
vi.mock("eventassigner-js", () => ({
  default: { eventAssignment: vi.fn() },
}));

test("should return an error when every PADG round fails", () => {
  const result = runPadgAssignment(
    [testProgramItem],
    [getUsers({ count: 1 })],
    testProgramItem.startTime,
    [],
  );

  expect(result.ok).toBe(false);
});
