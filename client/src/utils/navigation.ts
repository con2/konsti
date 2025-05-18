import { NavigationType, NavigateFunction } from "react-router";
import { AppRoute } from "client/app/AppRoutes";

export const navigateToPreviousOrRoot = async (
  navigationType: NavigationType,
  navigate: NavigateFunction,
): Promise<void> => {
  // Navigate to front page if no previous page exists
  if (navigationType === NavigationType.Pop) {
    await navigate(AppRoute.ROOT);
    return;
  }

  // Navigate to previous page
  await navigate(-1);
};
