import "core-js/stable";
import "regenerator-runtime/runtime";
import { createRoot } from "react-dom/client";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ThemeProvider, StyleSheetManager } from "styled-components";
import { init, browserTracingIntegration } from "@sentry/react";
import loaderImage from "assets/loading.gif";
import { config } from "shared/config";
import { getLocalStorageLocale } from "client/utils/localStorage";
import { theme } from "client/theme";
import { GlobalStyle } from "client/globalStyle";
import { setLocale } from "shared/utils/setLocale";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { store } from "client/utils/store";

// Initialized i18next instance
import "client/utils/i18n";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { lazyWithRetry } from "client/utils/lazyWithRetry";

initializeDayjs();
setLocale(getLocalStorageLocale());

// Root component
const App = lazyWithRetry(
  async () => await import(/* webpackChunkName: "app" */ "client/app/App"),
);

const { enableAxe, enableWhyDidYouRender } = config.client();

if (enableWhyDidYouRender && process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, { include: [/(.*?)/] });
}

if (enableAxe && process.env.NODE_ENV === "development") {
  const axe = require("@axe-core/react");
  axe(React, ReactDOM, 1000);
}

const getDsn = (): string | undefined => {
  switch (process.env.SETTINGS) {
    case "production":
      return "https://5b75f3722ea14d6d9307f4c736b3b58a@o1321706.ingest.sentry.io/6579203";
    case "staging":
      return "https://446b1c1e5b3048c4bb00b19b74aa55e6@o1321706.ingest.sentry.io/6578391";
    case "development":
      return config.shared().enableSentryInDev
        ? "https://1fb97a74de6a44e3b16e8d29aeec3363@o1321706.ingest.sentry.io/6579491"
        : undefined;
    default:
      return undefined;
  }
};

init({
  dsn: getDsn(),
  integrations: [
    // Use reactRouterV6BrowserTracingIntegration to enable performance monitoring
    // https://docs.sentry.io/platforms/javascript/guides/react/features/react-router/
    browserTracingIntegration({
      tracingOrigins: ["localhost", "dev.ropekonsti.fi", "ropekonsti.fi"],
    }),
  ],
  tracesSampleRate: config.shared().tracesSampleRate,
  normalizeDepth: 10,
  environment: process.env.SETTINGS,
  tunnel: ApiEndpoint.SENTRY_TUNNEL,
});

// Suspend fallback element
const loader = (
  <div style={{ textAlign: "center" }}>
    <img alt="Loading..." src={loaderImage} width="40" />
  </div>
);

const render = (): void => {
  const container = document.getElementById("main");

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
          <Suspense fallback={loader}>
            <GlobalStyle />
            <App />
          </Suspense>
        </ThemeProvider>
      </StyleSheetManager>
    </Provider>,
    // </React.StrictMode>
  );
};

window.onload = () => {
  render();
};
