import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { MyGamesView } from '../MyGamesView';

describe('MyGamesView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <MyGamesView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
