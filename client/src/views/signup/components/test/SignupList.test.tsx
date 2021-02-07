import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { Game } from 'common/typings/game';
import { SignupList, Props } from 'views/signup/components/SignupList';

const games: Game[] = [];
const signupTimes: string[] = [];
const leader = true;

describe('SignupList', () => {
  it('should render correctly', () => {
    const props: Props = {
      games,
      signupTimes,
      leader,
    };
    const component = shallow(
      <Provider store={store}>
        <SignupList {...props} />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
