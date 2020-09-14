import React from 'react';
import { shallow } from 'enzyme';
import { ResultsByGameTitle, Props } from '../ResultsByGameTitle';
import { Result } from 'typings/result.typings';

const results: Result[] = [];

describe('ResultsByGameTitle', () => {
  it('should render correctly', () => {
    const props: Props = { results };
    const component = shallow(<ResultsByGameTitle {...props} />);
    expect(component).toMatchSnapshot();
  });
});
