import React from 'react';
import { render } from '@testing-library/react';
import {
  MyFavoritesList,
  Props,
} from 'client/views/my-games/components/MyFavoritesList';

test('should render correctly', () => {
  const props: Props = { favoritedGames: [] };

  render(<MyFavoritesList {...props} />);
});
