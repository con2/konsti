import React from 'react';
import { shallow } from 'enzyme';
import { testGame } from 'test/test-data/testGame';
import { AllGamesList, Props } from '../AllGamesList';

const games = [testGame];

describe('AllGamesList', () => {
  it('should render correctly', () => {
    const props: Props = { games };
    const component = shallow(<AllGamesList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
