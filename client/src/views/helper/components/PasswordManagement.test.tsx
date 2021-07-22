import React from 'react';
import { render } from '@testing-library/react';
import { PasswordManagement } from 'client/views/helper/components/PasswordManagement';

test('should render correctly', () => {
  render(<PasswordManagement allowUsernameSearch={true} />);
});
