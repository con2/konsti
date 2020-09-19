import React from 'react';
import { shallow } from 'enzyme';
import { Hidden, Props } from '../Hidden';
import { Game } from 'typings/game.typings';

const hiddenGames: Game[] = [];

describe('Hidden', () => {
  it('should render correctly', () => {
    const props: Props = { hiddenGames };
    const component = shallow(<Hidden {...props} />);
    expect(component).toMatchSnapshot();
  });
});
