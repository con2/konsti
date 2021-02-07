import React from 'react';
import { shallow } from 'enzyme';
import { Error } from 'components/Error';

describe('Errors', () => {
  const meta = { touched: true, error: 'error' };

  it('should render correctly', () => {
    const component = shallow(<Error meta={meta} />);
    expect(component).toMatchSnapshot();
  });
});
