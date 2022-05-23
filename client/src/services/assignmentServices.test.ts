import axios from "axios";
import { postPlayerAssignment } from "client/services/assignmentServices";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

test("POST player assignment to server", async () => {
  mockAxios.post.mockImplementation(async () => {
    return await Promise.resolve({
      status: 200,
      data: "test response",
    });
  });

  const signupTime = "2019-07-26T13:00:00Z";

  const response = await postPlayerAssignment(signupTime);

  expect(response).toEqual("test response");
  expect(mockAxios.post).toHaveBeenCalledTimes(1);
  expect(mockAxios.post).toHaveBeenCalledWith(ApiEndpoint.ASSIGNMENT, {
    startingTime: signupTime,
  });
});
