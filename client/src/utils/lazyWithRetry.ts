import { ComponentType, LazyExoticComponent, lazy } from "react";
import { z } from "zod";
import { StringToJsonSchema } from "client/utils/zodUtils";

const pageForceRefreshedKey = "page-has-been-force-refreshed";
const PageForceRefreshedValueSchema = z.boolean();

const getPageForceRefreshedState = (): boolean => {
  const serializedValue = localStorage.getItem(pageForceRefreshedKey);

  const parseJsonResult = StringToJsonSchema.safeParse(serializedValue);
  if (!parseJsonResult.success) {
    return false;
  }

  const result = PageForceRefreshedValueSchema.safeParse(parseJsonResult.data);
  if (!result.success) {
    return false;
  }

  return result.data;
};

// https://raphael-leger.medium.com/react-webpack-chunkloaderror-loading-chunk-x-failed-ac385bd110e0
export const lazyWithRetry = (
  importComponent: () => Promise<{ default: ComponentType }>,
): LazyExoticComponent<ComponentType> =>
  lazy(async () => {
    const pageForceRefreshed = getPageForceRefreshedState();

    try {
      const component = await importComponent();
      localStorage.setItem(pageForceRefreshedKey, "false");
      return component;
    } catch (error) {
      if (!pageForceRefreshed) {
        localStorage.setItem(pageForceRefreshedKey, "true");
        location.reload();
      }

      // eslint-disable-next-line no-restricted-syntax -- Okay to throw if module loading fails after page reload
      throw error;
    }
  });
