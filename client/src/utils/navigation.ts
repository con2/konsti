import { NavigateFunction } from "react-router";

// Navigate to previous page or front page if no previous page exists
export const navigateToPreviousOrRoot = async (
  history: History,
  navigate: NavigateFunction,
): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (history.state?.idx > 0) {
    await navigate(-1);
  }
  await navigate("/");
};
