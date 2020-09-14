import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { GameDetails } from '../GameDetails';

jest.mock('react-router-dom', () => ({
  useHistory: () => {},
  useParams: () => {
    return {
      gameId: '1234',
    };
  },
}));

describe('GameDetails', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <GameDetails />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
