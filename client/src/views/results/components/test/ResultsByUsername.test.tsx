import React from 'react';
import { shallow } from 'enzyme';
import { ResultsByUsername, Props } from '../ResultsByUsername';
import { Result } from 'typings/result.typings';

const results: Result[] = [];

describe('ResultsByUsername', () => {
  it('should render correctly', () => {
    const props: Props = { results };
    const component = shallow(<ResultsByUsername {...props} />);
    expect(component).toMatchSnapshot();
  });
});
