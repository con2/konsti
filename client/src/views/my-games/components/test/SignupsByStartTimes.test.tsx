import React from 'react';
import { shallow } from 'enzyme';
import { SignupsByStartTimes, Props } from '../SignupsByStartTimes';
import { Signup } from 'typings/user.typings';

const signups: Signup[] = [];
const startTimes: string[] = [];

describe('SignupsByStartTimes', () => {
  it('should render correctly', () => {
    const props: Props = { signups, startTimes };
    const component = shallow(<SignupsByStartTimes {...props} />);
    expect(component).toMatchSnapshot();
  });
});
