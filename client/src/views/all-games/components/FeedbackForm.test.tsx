import React from 'react';
import { render } from '@testing-library/react';
import { testGame } from 'client/test/test-data/testGame';
import {
  FeedbackForm,
  Props,
} from 'client/views/all-games/components/FeedbackForm';

test('should render correctly', () => {
  const props: Props = { game: testGame };

  render(<FeedbackForm {...props} />);
});
