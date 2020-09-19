import React from 'react';
import { shallow } from 'enzyme';
import { ResultsList, Props } from '../ResultsList';
import { Result } from 'typings/result.typings';

const results: Result[] = [];

describe('ResultsList', () => {
  it('should render correctly', () => {
    const props: Props = { results };
    const component = shallow(<ResultsList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
