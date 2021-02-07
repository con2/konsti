import React from 'react';
import { shallow } from 'enzyme';
import { LanguageSelector } from 'components/LanguageSelector';

describe('LanguageSelector', () => {
  it('should render correctly', () => {
    const component = shallow(<LanguageSelector />);
    expect(component).toMatchSnapshot();
  });
});
