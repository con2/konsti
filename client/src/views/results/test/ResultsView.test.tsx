import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { ResultsView } from '../ResultsView';

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
