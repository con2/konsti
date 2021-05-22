import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { SignupView } from 'client/views/signup/SignupView';

jest.doMock('client/utils/loadData');

test('should render correctly', () => {
  render(
    <Provider store={store}>
      <SignupView />
    </Provider>
  );
});
