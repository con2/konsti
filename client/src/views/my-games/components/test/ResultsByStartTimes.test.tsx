import React from 'react';
import { shallow } from 'enzyme';
import {
  ResultsByStartTimes,
  Props,
} from 'client/views/my-games/components/ResultsByStartTimes';
import { SelectedGame } from 'shared/typings/models/user';

const signups: SelectedGame[] = [];
const startTimes: string[] = [];
const missedSignups: readonly string[] = [];

describe('ResultsByStartTimes', () => {
  it('should render correctly', () => {
    const props: Props = { signups, startTimes, missedSignups };
    const component = shallow(<ResultsByStartTimes {...props} />);
    expect(component).toMatchSnapshot();
  });
});
