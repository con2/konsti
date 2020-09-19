import React from 'react';
import { shallow } from 'enzyme';
import { DropRow, Props } from '../DropRow';
import { Game } from 'typings/game.typings';

const droppableId = 'testId';
const games: Game[] = [];
const label = 'test label';
const showCount = true;

describe('DropRow', () => {
  it('should render correctly', () => {
    const props: Props = {
      droppableId,
      games,
      label,
      showCount,
    };
    const component = shallow(<DropRow {...props} />);
    expect(component).toMatchSnapshot();
  });
});
