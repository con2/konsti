import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { AllGamesView } from 'views/all-games/AllGamesView';

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
