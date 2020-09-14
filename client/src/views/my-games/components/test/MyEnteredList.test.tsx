import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { MyEnteredList, Props } from '../MyEnteredList';
import { Signup } from 'typings/user.typings';

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
