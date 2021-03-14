import React from 'react';
import { shallow } from 'enzyme';
import { Game } from 'shared/typings/game';
import {
  GamesByStartTimes,
  Props,
} from 'client/views/my-games/components/GamesByStartTimes';

const games: Game[] = [];
const startTimes: string[] = [];

describe('GamesByStartTimes', () => {
  it('should render correctly', () => {
    const props: Props = { games, startTimes };
    const component = shallow(<GamesByStartTimes {...props} />);
    expect(component).toMatchSnapshot();
  });
});
