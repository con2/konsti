import React from 'react';
import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { Routes, Props } from 'client/app/Routes';
import { BrowserRouter } from 'react-router-dom';
import * as loadData from 'client/utils/loadData';

jest.spyOn(loadData, 'loadGames').mockReturnValue(Promise.resolve());

test('should render correctly', async () => {
  const props: Props = { onlyAdminLoginAllowed: false };

  await act(async () => {
    await render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes {...props} />
        </BrowserRouter>
      </Provider>
    );
  });
});
