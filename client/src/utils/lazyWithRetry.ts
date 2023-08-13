import { ComponentType, LazyExoticComponent, lazy } from "react";

// https://raphael-leger.medium.com/react-webpack-chunkloaderror-loading-chunk-x-failed-ac385bd110e0
export const lazyWithRetry = (
  importComponent: () => Promise<{ default: ComponentType }>,
  fallbackComponent: () => Promise<{ default: ComponentType }>,
): LazyExoticComponent<ComponentType> =>
  lazy(async () => {
    const isPageHasBeenForceRefreshed = JSON.parse(
      localStorage.getItem("page-has-been-force-refreshed") ?? "false",
    );

    try {
      const component = await importComponent();
      localStorage.setItem("page-has-been-force-refreshed", "false");
      return component;
    } catch (error) {
      if (!isPageHasBeenForceRefreshed) {
        localStorage.setItem("page-has-been-force-refreshed", "true");
        location.reload();
        const fallback = await fallbackComponent();
        return fallback;
      }

      // eslint-disable-next-line no-restricted-syntax -- Okay to throw if module loading fails after page reload
      throw error;
    }
  });
