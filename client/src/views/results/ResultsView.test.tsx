import React from 'react';
import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react';
import { store } from 'client/utils/store';
import { ResultsView } from 'client/views/results/ResultsView';
import * as loadData from 'client/utils/loadData';

jest.spyOn(loadData, 'loadSettings').mockReturnValue(Promise.resolve());

test('should render correctly', async () => {
  await act(async () => {
    render(
      <Provider store={store}>
        <ResultsView />
      </Provider>
    );
  });
});
