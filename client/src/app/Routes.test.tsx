import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { act, render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { Routes } from 'client/app/Routes';
import * as loadData from 'client/utils/loadData';

jest.spyOn(loadData, 'loadGames').mockReturnValue(Promise.resolve());

test('should render correctly', async () => {
  await act(async () => {
    await render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );
  });
});
