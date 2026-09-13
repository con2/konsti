import { captureException } from "@sentry/react";
import { ComponentType, LazyExoticComponent, lazy } from "react";
import { browserStorageEventPrefix } from "shared/constants/browserStorage";

// Keyed per chunk, not once for the whole app. A shared flag is cleared by any
// import that succeeds, and the app's own chunk succeeds on every load - so a
// view whose chunk stays broken would set the flag, reload, have it cleared
// again, and reload forever without ever reaching an error boundary.
const retryKey = (chunkName: string): string =>
  `${browserStorageEventPrefix}-chunk-retry-${chunkName}`;

// Exported so the retry behavior can be unit tested without rendering
// https://raphael-leger.medium.com/react-webpack-chunkloaderror-loading-chunk-x-failed-ac385bd110e0
export const importWithRetry = async (
  chunkName: string,
  importComponent: () => Promise<{ default: ComponentType }>,
): Promise<{ default: ComponentType }> => {
  const key = retryKey(chunkName);
  const alreadyRetried = localStorage.getItem(key) === "true";

  try {
    const component = await importComponent();
    localStorage.removeItem(key);
    return component;
  } catch (error) {
    if (!alreadyRetried) {
      localStorage.setItem(key, "true");
      location.reload();
      // Return a never-resolving promise to prevent the error from
      // reaching Sentry while the page reloads
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return new Promise(() => {});
    }

    // Reported as a new error rather than the caught one, which the module
    // loader throws with the document URL as its only frame: that frame carries
    // none of the build's stamps, so the injected-script filter discards it
    const detail = error instanceof Error ? error.message : String(error);
    captureException(
      new Error(`Chunk load failed after retry: ${chunkName} - ${detail}`),
    );

    // The flag stays set: clearing it here would let the next load reload
    // once more for the same broken chunk, forever. This chunk importing
    // successfully clears it, which is what makes a later failure retry again
    // eslint-disable-next-line no-restricted-syntax -- Okay to throw if module loading fails after page reload.
    throw error;
  }
};

export const lazyWithRetry = (
  chunkName: string,
  importComponent: () => Promise<{ default: ComponentType }>,
): LazyExoticComponent<ComponentType> =>
  lazy(async () => await importWithRetry(chunkName, importComponent));
