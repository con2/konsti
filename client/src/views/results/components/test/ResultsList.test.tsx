import React from 'react';
import { render } from '@testing-library/react';
import {
  ResultsList,
  Props,
} from 'client/views/results/components/ResultsList';

test('should render correctly', () => {
  const props: Props = { results: [] };

  render(<ResultsList {...props} />);
});
