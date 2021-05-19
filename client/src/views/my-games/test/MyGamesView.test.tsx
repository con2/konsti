import React from 'react';
import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { MyGamesView } from 'client/views/my-games/MyGamesView';
import * as loadData from 'client/utils/loadData';

jest.spyOn(loadData, 'loadGames').mockReturnValue(Promise.resolve());
jest.spyOn(loadData, 'loadUser').mockReturnValue(Promise.resolve());
jest.spyOn(loadData, 'loadGroupMembers').mockReturnValue(Promise.resolve());

test('should render correctly', async () => {
  await act(async () => {
    render(
      <Provider store={store}>
        <MyGamesView />
      </Provider>
    );
  });
});
