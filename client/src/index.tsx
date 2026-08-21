import { ErrorBoundary, init } from "@sentry/react";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { StyleSheetManager, ThemeProvider } from "styled-components";
import { config } from "shared/config";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { setLocale } from "shared/utils/setLocale";
import loaderImage from "assets/loading.gif";
import { AppErrorFallback } from "client/components/AppErrorFallback";
import { GlobalStyle } from "client/globalStyle";
import { theme } from "client/theme";
import { getLocalStorageLocale } from "client/utils/localStorage";
import { store } from "client/utils/store";
// Initialized i18next instance
import "client/utils/i18n";
import { lazyWithRetry } from "client/utils/lazyWithRetry";
import { resetStaleEventStorage } from "client/utils/resetStaleEventStorage";

resetStaleEventStorage();
setLocale(getLocalStorageLocale());

// The app manages scroll itself on navigation (views reset to the top on
// mount, the program list restores its own saved position), so disable the
// browser's history scroll restoration — WebKit applies it asynchronously on
// back navigation and overrides the app's restore with a stale offset
history.scrollRestoration = "manual";

// Root component
const App = lazyWithRetry("App", async () => await import("client/app/App"));

const { enableAxe, enableWhyDidYouRender } = config.client();

if (enableWhyDidYouRender && process.env.NODE_ENV === "development") {
  void (async () => {
    const { default: whyDidYouRender } =
      await import("@welldone-software/why-did-you-render");
    whyDidYouRender(React, {
      include: [/(.*?)/],
      exclude: [/^FontAwesomeIcon$/, /^Link$/, /^Button$/],
    });
  })();
}

if (enableAxe && process.env.NODE_ENV === "development") {
  void (async () => {
    const { default: axe } = await import("@axe-core/react");
    await axe(React, ReactDOM, 1000);
  })();
}

const getDsn = (): string | undefined => {
  switch (process.env.SETTINGS) {
    case "production":
      return "https://5b75f3722ea14d6d9307f4c736b3b58a@o1321706.ingest.sentry.io/6579203";
    case "staging":
      return "https://446b1c1e5b3048c4bb00b19b74aa55e6@o1321706.ingest.sentry.io/6578391";
    case "development":
      return config.sentry().enableSentryInDev
        ? "https://1fb97a74de6a44e3b16e8d29aeec3363@o1321706.ingest.sentry.io/6579491"
        : undefined;
    default:
      return undefined;
  }
};

init({
  dsn: getDsn(),
  // Drop the default session tracking and client reports
  // Tunnel traffic is error events only
  integrations: (defaultIntegrations) =>
    defaultIntegrations.filter(
      (integration) => integration.name !== "BrowserSession",
    ),
  sendClientReports: false,
  normalizeDepth: 10,
  environment: process.env.SETTINGS,
  tunnel: ApiEndpoint.SENTRY_TUNNEL,
  ignoreErrors: [
    // Error when Outlook scans a link
    // https://github.com/getsentry/sentry-javascript/issues/3440
    "Non-Error promise rejection captured with value: Object Not Found Matching Id:",
    // Error from the script the Instagram iOS in-app browser injects into every page
    "evaluating 'window.webkit.messageHandlers'",
  ],
  denyUrls: [
    // Errors from scripts the Facebook in-app browser injects into every page
    /^iabjs:\/\//,
  ],
  maxValueLength: config.sentry().maxValueLength,
});

// Suspend fallback element
const loader = (
  <div style={{ textAlign: "center" }}>
    <img alt="Loading..." src={loaderImage} width="40" />
  </div>
);

const render = (): void => {
  const container = document.querySelector("#main");

  if (!container) {
    // eslint-disable-next-line no-restricted-syntax -- We want to throw here
    throw new Error("Unable to find React root element 'main'");
  }

  const root = createRoot(container);

  root.render(
    // <React.StrictMode>
    <Provider store={store}>
      <StyleSheetManager enableVendorPrefixes={true}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          {/* Catches what the boundary around the routes cannot: the app failing
              before it is mounted, most often its chunk not loading. Without
              this, React unmounts the tree and the user is left on a blank page.
              Inside the theme provider so the fallback can be styled */}
          <ErrorBoundary fallback={AppErrorFallback}>
            <Suspense fallback={loader}>
              <App />
            </Suspense>
          </ErrorBoundary>
        </ThemeProvider>
      </StyleSheetManager>
    </Provider>,
    // </React.StrictMode>
  );
};

addEventListener("load", () => {
  render();
});
