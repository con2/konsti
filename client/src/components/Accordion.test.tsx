import React from 'react';
import { render } from '@testing-library/react';
import { Accordion, Props } from 'client/components/Accordion';

test('should render correctly', () => {
  const props: Props = {
    title: 'test title',
    text: 'test text',
    buttonText: 'test button text',
  };

  render(<Accordion {...props} />);
  // expect(screen.getByRole('heading')).toHaveTextContent('Welcome, John Doe');
});
