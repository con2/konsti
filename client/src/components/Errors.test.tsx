import React from 'react';
import { render } from '@testing-library/react';
import { Error } from 'client/components/Error';

const meta = { touched: true, error: 'error' };

test('should render correctly', () => {
  render(<Error meta={meta} />);
});
