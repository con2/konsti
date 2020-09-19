import React from 'react';
import { shallow } from 'enzyme';
import { MySignupsList, Props } from '../MySignupsList';
import { Signup } from 'typings/user.typings';

const signedGames: Signup[] = [];

describe('MySignupsList', () => {
  it('should render correctly', () => {
    const props: Props = { signedGames };
    const component = shallow(<MySignupsList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
