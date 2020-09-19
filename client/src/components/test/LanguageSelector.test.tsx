import React from 'react';
import { shallow } from 'enzyme';
import { LanguageSelector } from '../LanguageSelector';

describe('LanguageSelector', () => {
  it('should render correctly', () => {
    const component = shallow(<LanguageSelector />);
    expect(component).toMatchSnapshot();
  });
});
