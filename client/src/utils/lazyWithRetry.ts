import { ComponentType, LazyExoticComponent, lazy } from "react";

const pageForceRefreshedKey = "page-has-been-force-refreshed";

// https://raphael-leger.medium.com/react-webpack-chunkloaderror-loading-chunk-x-failed-ac385bd110e0
export const lazyWithRetry = (
  importComponent: () => Promise<{ default: ComponentType }>,
): LazyExoticComponent<ComponentType> =>
  lazy(async () => {
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

      // eslint-disable-next-line no-restricted-syntax -- Okay to throw if module loading fails after page reload
      throw error;
    }
  });
