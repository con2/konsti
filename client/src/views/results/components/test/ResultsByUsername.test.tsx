import React from 'react';
import { shallow } from 'enzyme';
import { Result } from 'shared/typings/models/result';
import {
  ResultsByUsername,
  Props,
} from 'client/views/results/components/ResultsByUsername';

const results: Result[] = [];

describe('ResultsByUsername', () => {
  it('should render correctly', () => {
    const props: Props = { results };
    const component = shallow(<ResultsByUsername {...props} />);
    expect(component).toMatchSnapshot();
  });
});
