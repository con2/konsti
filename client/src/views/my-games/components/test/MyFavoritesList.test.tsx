import React from 'react';
import { shallow } from 'enzyme';
import { Game } from 'shared/typings/game';
import {
  MyFavoritesList,
  Props,
} from 'views/my-games/components/MyFavoritesList';

const favoritedGames: Game[] = [];

describe('MyFavoritesList', () => {
  it('should render correctly', () => {
    const props: Props = { favoritedGames };
    const component = shallow(<MyFavoritesList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
