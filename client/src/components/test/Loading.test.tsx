import React from 'react';
import { shallow } from 'enzyme';
import { Loading } from 'components/Loading';

describe('Loading', () => {
  it('should render correctly', () => {
    const component = shallow(<Loading />);
    expect(component).toMatchSnapshot();
  });
});
