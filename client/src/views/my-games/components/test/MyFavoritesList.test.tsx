import React from 'react';
import { shallow } from 'enzyme';
import { MyFavoritesList, Props } from '../MyFavoritesList';
import { Game } from 'typings/game.typings';

const favoritedGames: Game[] = [];

describe('MyFavoritesList', () => {
  it('should render correctly', () => {
    const props: Props = { favoritedGames };
    const component = shallow(<MyFavoritesList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
