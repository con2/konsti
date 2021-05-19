import React from 'react';
import { render } from '@testing-library/react';
import {
  ResultsByStartTimes,
  Props,
} from 'client/views/my-games/components/ResultsByStartTimes';

test('should render correctly', () => {
  const props: Props = { signups: [], startTimes: [], missedSignups: [] };

  render(<ResultsByStartTimes {...props} />);
});
