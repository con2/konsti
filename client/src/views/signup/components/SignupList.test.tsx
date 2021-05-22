import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { SignupList, Props } from 'client/views/signup/components/SignupList';

test('should render correctly', () => {
  const props: Props = {
    games: [],
    signupTimes: [],
    leader: true,
  };

  render(
    <Provider store={store}>
      <SignupList {...props} />
    </Provider>
  );
});
