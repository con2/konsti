import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { Signup } from 'client/typings/user.typings';
import {
  MyEnteredList,
  Props,
} from 'client/views/my-games/components/MyEnteredList';

const enteredGames: Signup[] = [];
const signedGames: Signup[] = [];

describe('MyEnteredList', () => {
  it('should render correctly', () => {
    const props: Props = { enteredGames, signedGames };
    const component = shallow(
      <Provider store={store}>
        <MyEnteredList {...props} />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
