import { ComponentType, LazyExoticComponent, lazy } from "react";

const pageForceRefreshedKey = "page-has-been-force-refreshed";

// Exported so the retry behavior can be unit tested without rendering
// https://raphael-leger.medium.com/react-webpack-chunkloaderror-loading-chunk-x-failed-ac385bd110e0
export const importWithRetry = async (
  importComponent: () => Promise<{ default: ComponentType }>,
): Promise<{ default: ComponentType }> => {
  const pageForceRefreshed =
    localStorage.getItem(pageForceRefreshedKey) === "true";

  try {
    const component = await importComponent();
    localStorage.setItem(pageForceRefreshedKey, "false");
    return component;
  } catch (error) {
    if (!pageForceRefreshed) {
      localStorage.setItem(pageForceRefreshedKey, "true");
      location.reload();
      // Return a never-resolving promise to prevent the error from
      // reaching Sentry while the page reloads
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return new Promise(() => {});
    }

    // Reset the flag so a future unrelated failure gets a reload retry
    // instead of throwing immediately
    localStorage.setItem(pageForceRefreshedKey, "false");

    // eslint-disable-next-line no-restricted-syntax -- Okay to throw if module loading fails after page reload
    throw error;
  }
};

export const lazyWithRetry = (
  importComponent: () => Promise<{ default: ComponentType }>,
): LazyExoticComponent<ComponentType> =>
  lazy(async () => await importWithRetry(importComponent));
