import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { testGame } from 'test/test-data/testGame';
import { AllGamesList, Props } from '../AllGamesList';

const games = [testGame];

describe('AllGamesList', () => {
  it('should render correctly', () => {
    const props: Props = { games };
    const component = shallow(
      <Provider store={store}>
        <AllGamesList {...props} />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
