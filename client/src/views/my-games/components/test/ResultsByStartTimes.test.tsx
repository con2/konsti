import React from 'react';
import { shallow } from 'enzyme';
import { Signup } from 'typings/user.typings';
import {
  ResultsByStartTimes,
  Props,
} from 'views/my-games/components/ResultsByStartTimes';

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
