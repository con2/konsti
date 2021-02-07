import React from 'react';
import { shallow } from 'enzyme';
import { Result } from 'typings/result.typings';
import {
  ResultsByGameTitle,
  Props,
} from 'views/results/components/ResultsByGameTitle';

const results: Result[] = [];

describe('ResultsByGameTitle', () => {
  it('should render correctly', () => {
    const props: Props = { results };
    const component = shallow(<ResultsByGameTitle {...props} />);
    expect(component).toMatchSnapshot();
  });
});
