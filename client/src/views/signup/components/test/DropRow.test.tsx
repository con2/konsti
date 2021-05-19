import React from 'react';
import { render } from '@testing-library/react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { DropRow, Props } from 'client/views/signup/components/DropRow';

test('should render correctly', () => {
  const props: Props = {
    droppableId: 'testId',
    games: [],
    label: 'test label',
    showCount: true,
  };

  const onDragEnd = (_result: DropResult): void => {};

  render(
    <DragDropContext onDragEnd={onDragEnd}>
      <DropRow {...props} />
    </DragDropContext>
  );
});
