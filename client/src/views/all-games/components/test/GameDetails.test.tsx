import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { GameDetails } from 'client/views/all-games/components/GameDetails';

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
