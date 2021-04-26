import React from 'react';
import { shallow } from 'enzyme';
import { Result } from 'shared/typings/models/result';
import {
  ResultsList,
  Props,
} from 'client/views/results/components/ResultsList';

const results: Result[] = [];

describe('ResultsList', () => {
  it('should render correctly', () => {
    const props: Props = { results };
    const component = shallow(<ResultsList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
