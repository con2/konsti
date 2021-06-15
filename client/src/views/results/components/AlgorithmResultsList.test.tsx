import React from 'react';
import { render } from '@testing-library/react';
import {
  AlgorithmResultsList,
  Props,
} from 'client/views/results/components/AlgorithmResultsList';

test('should render correctly', () => {
  const props: Props = { results: [] };

  render(<AlgorithmResultsList {...props} />);
});
