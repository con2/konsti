import React from 'react';
import { render } from '@testing-library/react';
import {
  GamesByStartTimes,
  Props,
} from 'client/views/my-games/components/GamesByStartTimes';

test('should render correctly', () => {
  const props: Props = { games: [], startTimes: [] };

  render(<GamesByStartTimes {...props} />);
});
