import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { LoginView } from 'client/views/login/LoginView';

test('should render correctly', () => {
  render(
    <Provider store={store}>
      <LoginView />
    </Provider>
  );
});
