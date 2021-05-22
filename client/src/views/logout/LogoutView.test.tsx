import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { LogoutView } from 'client/views/logout/LogoutView';
import { BrowserRouter } from 'react-router-dom';

test('should render correctly', () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <LogoutView />
      </BrowserRouter>
    </Provider>
  );
});
