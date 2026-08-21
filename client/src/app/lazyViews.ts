import { ComponentType } from "react";
import { UserGroup } from "shared/types/models/user";
import { isAdmin, isAdminOrHelper } from "client/utils/checkUserGroup";
import { lazyWithRetry } from "client/utils/lazyWithRetry";

// The views kept out of the main bundle: the About tabs carry the bulk of the
// Markdown content, and the admin and helper tools are reachable by a handful
// of users. They render inside the Suspense boundary that wraps the routes.
//
// The prefetch list at the bottom must stay in step with these - a view split
// without a matching entry keeps its loading spinner on every visit

type ViewImport = () => Promise<{ default: ComponentType }>;

const importAboutView: ViewImport = async () => ({
  default: (await import("client/views/about/AboutView")).AboutView,
});
const importFaqView: ViewImport = async () => ({
  default: (await import("client/views/about/FaqView")).FaqView,
});
const importInstructionsView: ViewImport = async () => ({
  default: (await import("client/views/about/InstructionsView"))
    .InstructionsView,
});
const importAdminView: ViewImport = async () => ({
  default: (await import("client/views/admin/AdminView")).AdminView,
});
const importHelperView: ViewImport = async () => ({
  default: (await import("client/views/helper/HelperView")).HelperView,
});

export const AboutView = lazyWithRetry("AboutView", importAboutView);
export const FaqView = lazyWithRetry("FaqView", importFaqView);
export const InstructionsView = lazyWithRetry(
  "InstructionsView",
  importInstructionsView,
);
export const AdminView = lazyWithRetry("AdminView", importAdminView);
export const HelperView = lazyWithRetry("HelperView", importHelperView);

const prefetchView = async (importView: ViewImport): Promise<void> => {
  try {
    await importView();
  } catch {
    // Nothing useful to do here, but note the cost: the browser caches a
    // failed dynamic import for the rest of the session, so this chunk is now
    // poisoned and opening the view will reject instantly and reload the page
    // rather than refetch. That is why the caller only prefetches after a data
    // load has succeeded and the connection looks usable
  }
};

// Some attendees are on metered or barely-working mobile data, where warming
// chunks they may never open is a bad trade
const connectionIsTooPoor = (): boolean => {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (!connection) {
    return false;
  }

  return (
    connection.saveData === true ||
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g"
  );
};

// Warms the chunks above so opening one of these views doesn't wait on a
// download. The caller decides when, because this must not compete with the
// requests that put content on screen. The staff tools are fetched only for
// the roles that can reach them, to keep the transfer off everyone else's
// connection
export const prefetchLazyViews = (userGroup: UserGroup): void => {
  if (connectionIsTooPoor()) {
    return;
  }

  const imports = [importAboutView, importFaqView, importInstructionsView];

  if (isAdminOrHelper(userGroup)) {
    imports.push(importHelperView);
  }
  if (isAdmin(userGroup)) {
    imports.push(importAdminView);
  }

  for (const importView of imports) {
    void prefetchView(importView);
  }
};
