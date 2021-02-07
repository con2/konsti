import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { ResultsView } from 'views/results/ResultsView';

describe('ResultsView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <ResultsView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
