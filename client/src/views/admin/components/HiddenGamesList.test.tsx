import React from 'react';
import { render } from '@testing-library/react';
import {
  HiddenGamesList,
  Props,
} from 'client/views/admin/components/HiddenGamesList';

test('should render correctly', () => {
  const props: Props = { hiddenGames: [] };

  render(<HiddenGamesList {...props} />);
});
