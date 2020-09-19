import React from 'react';
import { shallow } from 'enzyme';
import { GamesByStartTimes, Props } from '../GamesByStartTimes';
import { Game } from 'typings/game.typings';

const games: Game[] = [];
const startTimes: string[] = [];

describe('GamesByStartTimes', () => {
  it('should render correctly', () => {
    const props: Props = { games, startTimes };
    const component = shallow(<GamesByStartTimes {...props} />);
    expect(component).toMatchSnapshot();
  });
});
