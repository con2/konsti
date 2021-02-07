import React from 'react';
import { shallow } from 'enzyme';
import { Signup } from 'typings/user.typings';
import {
  SignupsByStartTimes,
  Props,
} from 'views/my-games/components/SignupsByStartTimes';

const signups: Signup[] = [];
const startTimes: string[] = [];

describe('SignupsByStartTimes', () => {
  it('should render correctly', () => {
    const props: Props = { signups, startTimes };
    const component = shallow(<SignupsByStartTimes {...props} />);
    expect(component).toMatchSnapshot();
  });
});
