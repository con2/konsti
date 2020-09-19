import 'core-js/stable';
import 'regenerator-runtime/runtime';
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import moment from 'moment';
import { ThemeProvider } from 'styled-components';
import loaderImage from 'assets/loading.gif';
import { config } from 'config';
import { getLanguage } from 'utils/localStorage';
import { theme } from 'theme';
import { GlobalStyle } from 'globalStyle';

// Initialized i18next instance
import 'utils/i18n';

// Redux store
import { store } from 'utils/store';

moment.locale(getLanguage());

// Root component
const App = lazy(async () => await import('app/App'));

const { enableAxe, enableWhyDidYouRender } = config;

if (enableWhyDidYouRender && process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, { include: [/(.*?)/] });
}

if (enableAxe && process.env.NODE_ENV === 'development') {
  const axe = require('react-axe');
  axe(React, ReactDOM, 1000);
}

// Suspend fallback element
const loader = (
  <div className='loading'>
    <img alt='Loading...' src={loaderImage} />
  </div>
);

const render = (): void => {
  const rootReactElement = document.getElementById('main');

  ReactDOM.render(
    // <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Suspense fallback={loader}>
          <GlobalStyle />
          <App />
        </Suspense>
      </ThemeProvider>
    </Provider>,
    // </React.StrictMode>,
    rootReactElement
  );
};

window.onload = () => {
  render();
};
