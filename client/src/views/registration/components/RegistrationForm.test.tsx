import React from 'react';
import { render } from '@testing-library/react';
import RegistrationForm from 'client/views/registration/components/RegistrationForm';
import { store } from 'client/utils/store';
import { Provider } from 'react-redux';

test('should render correctly', () => {
  render(
    <Provider store={store}>
      <RegistrationForm />
    </Provider>
  );
});
