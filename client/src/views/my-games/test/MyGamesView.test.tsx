import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { MyGamesView } from 'client/views/my-games/MyGamesView';

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
