import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { store } from 'client/utils/store';
import {
  MyEnteredList,
  Props,
} from 'client/views/my-games/components/MyEnteredList';

test('should render correctly', () => {
  const props: Props = { enteredGames: [], signedGames: [] };

  render(
    <Provider store={store}>
      <MyEnteredList {...props} />
    </Provider>
  );
});
