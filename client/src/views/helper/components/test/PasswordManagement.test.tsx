import React from 'react';
import { shallow } from 'enzyme';
import { PasswordManagement } from 'client/views/helper/components/PasswordManagement';

describe('PasswordManagement', () => {
  it('should render correctly', () => {
    const component = shallow(<PasswordManagement />);
    expect(component).toMatchSnapshot();
  });
});
