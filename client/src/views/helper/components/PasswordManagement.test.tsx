import React from 'react';
import { render } from '@testing-library/react';
import { PasswordManagement } from 'client/views/helper/components/PasswordManagement';

/*
jest.mock('client/services/userServices', () => ({
  getUserBySerial: jest.fn(),
  updateUserPassword: jest.fn(),
}));
*/

// getUserBySerial.mockImplementation(() => {});

// jest.fn(updateUserPassword);

test('should render correctly', () => {
  render(<PasswordManagement />);
});
