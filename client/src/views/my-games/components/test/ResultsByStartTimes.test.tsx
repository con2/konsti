import React from 'react';
import { shallow } from 'enzyme';
import { ResultsByStartTimes, Props } from '../ResultsByStartTimes';
import { Signup } from 'typings/user.typings';

const signups: Signup[] = [];
const startTimes: string[] = [];
const missedSignups: readonly string[] = [];

describe('ResultsByStartTimes', () => {
  it('should render correctly', () => {
    const props: Props = { signups, startTimes, missedSignups };
    const component = shallow(<ResultsByStartTimes {...props} />);
    expect(component).toMatchSnapshot();
  });
});
