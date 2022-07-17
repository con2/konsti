import "core-js/stable";
import "regenerator-runtime/runtime";
import { createRoot } from "react-dom/client";
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import dayjs from "dayjs";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import loaderImage from "assets/loading.gif";
import { config } from "client/config";
import { getLanguage } from "client/utils/localStorage";
import { theme } from "client/theme";
import { GlobalStyle } from "client/globalStyle";
import { setLocale } from "shared/utils/setLocale";

// Initialized i18next instance
import "client/utils/i18n";

// Redux store
import { store } from "client/utils/store";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
setLocale(getLanguage());

// Root component
const App = lazy(async () => await import("client/app/App"));

const { enableAxe, enableWhyDidYouRender } = config;

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
      return "https://1fb97a74de6a44e3b16e8d29aeec3363@o1321706.ingest.sentry.io/6579491";
    default:
      return undefined;
  }
};

Sentry.init({
  dsn: getDsn(),
  integrations: [
    new BrowserTracing({
      tracingOrigins: ["localhost", "test.ropekonsti.fi", "ropekonsti.fi"],
    }),
  ],
  tracesSampleRate: 0.2,
  normalizeDepth: 10,
  environment: process.env.SETTINGS,
});

// Suspend fallback element
const loader = (
  <div>
    <img alt="Loading..." src={loaderImage} />
  </div>
);

const render = (): void => {
  const container = document.getElementById("main") as HTMLElement;
  const root = createRoot(container);

  root.render(
    // <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Suspense fallback={loader}>
          <GlobalStyle />
          <App />
        </Suspense>
      </ThemeProvider>
    </Provider>
    // </React.StrictMode>
  );
};

window.onload = () => {
  render();
};
