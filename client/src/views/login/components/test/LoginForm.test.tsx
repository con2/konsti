import React from 'react';
import { shallow } from 'enzyme';
import LoginForm from 'views/login/components/LoginForm';

describe('LoginForm', () => {
  it('should render correctly', () => {
    const component = shallow(<LoginForm />);
    expect(component).toMatchSnapshot();
  });
});
