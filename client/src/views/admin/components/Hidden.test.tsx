import React from 'react';
import { render } from '@testing-library/react';
import { Hidden, Props } from 'client/views/admin/components/Hidden';

test('should render correctly', () => {
  const props: Props = { hiddenGames: [] };

  render(<Hidden {...props} />);
});
