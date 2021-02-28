import React from 'react';
import { shallow } from 'enzyme';
import { Signup } from 'client/typings/user.typings';
import {
  MySignupsList,
  Props,
} from 'client/views/my-games/components/MySignupsList';

const signedGames: Signup[] = [];

describe('MySignupsList', () => {
  it('should render correctly', () => {
    const props: Props = { signedGames };
    const component = shallow(<MySignupsList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
