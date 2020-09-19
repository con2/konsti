import React from 'react';
import { shallow } from 'enzyme';
import { TimesDropdown, Props } from '../TimesDropdown';

describe('TimesDropdown', () => {
  it('should render correctly', () => {
    const props: Props = { times: [], onChange: () => {}, selectedTime: '' };
    const component = shallow(<TimesDropdown {...props} />);
    expect(component).toMatchSnapshot();
  });
});
