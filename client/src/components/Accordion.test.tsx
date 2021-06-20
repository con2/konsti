import React from 'react';
import { render } from '@testing-library/react';
import { Accordion, Props } from 'client/components/Accordion';

test('should render correctly', () => {
  const props: Props = {
    toggleButton: 'test button text',
  };

  render(<Accordion {...props} />);
});
