import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { RegistrationView } from 'client/views/registration/RegistrationView';

test('should render correctly', () => {
  render(
    <Provider store={store}>
      <RegistrationView />
    </Provider>
  );
});
