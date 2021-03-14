import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { Game } from 'shared/typings/models/game';
import {
  DragAndDropList,
  Props,
} from 'client/views/signup/components/DragAndDropList';

const updateSelectedGames = (): void => {};
const availableGames: Game[] = [];
const selectedGames: Game[] = [];

describe('DragAndDropList', () => {
  it('should render correctly', () => {
    const props: Props = {
      updateSelectedGames,
      availableGames,
      selectedGames,
    };
    const component = shallow(
      <Provider store={store}>
        <DragAndDropList {...props} />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
