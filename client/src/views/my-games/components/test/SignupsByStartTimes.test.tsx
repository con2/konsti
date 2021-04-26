import React from 'react';
import { shallow } from 'enzyme';
import {
  SignupsByStartTimes,
  Props,
} from 'client/views/my-games/components/SignupsByStartTimes';
import { SelectedGame } from 'shared/typings/models/user';

const signups: SelectedGame[] = [];
const startTimes: string[] = [];

describe('SignupsByStartTimes', () => {
  it('should render correctly', () => {
    const props: Props = { signups, startTimes };
    const component = shallow(<SignupsByStartTimes {...props} />);
    expect(component).toMatchSnapshot();
  });
});
