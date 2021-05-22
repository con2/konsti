import React from 'react';
import { render } from '@testing-library/react';
import { Loading } from 'client/components/Loading';

test('should render correctly', () => {
  render(<Loading />);
});
