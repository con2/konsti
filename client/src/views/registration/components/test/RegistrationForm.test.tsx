import React from 'react';
import { shallow } from 'enzyme';
import RegistrationForm from '../RegistrationForm';

describe('RegistrationForm', () => {
  it('should render correctly', () => {
    const component = shallow(<RegistrationForm />);
    expect(component).toMatchSnapshot();
  });
});
