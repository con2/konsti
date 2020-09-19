import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { AllGamesView } from '../AllGamesView';

describe('AllGamesView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <AllGamesView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
