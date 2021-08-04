import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { RegistrationForm } from 'client/views/registration/components/RegistrationForm';
import { store } from 'client/utils/store';

test('should render correctly', () => {
  render(
    <Provider store={store}>
      <RegistrationForm />
    </Provider>
  );
});
