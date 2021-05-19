import React from 'react';
import { render } from '@testing-library/react';
import { TimesDropdown, Props } from 'client/components/TimesDropdown';

test('should render correctly', () => {
  const props: Props = { times: [], onChange: () => {}, selectedTime: '' };

  render(<TimesDropdown {...props} />);
});
