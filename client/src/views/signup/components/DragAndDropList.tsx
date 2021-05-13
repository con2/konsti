import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { DropRow } from 'client/views/signup/components/DropRow';
import { reorder, move } from 'client/utils/dragAndDrop';
import { sleep } from 'client/utils/sleep';
import { config } from 'client/config';
import { DnDUpdatedPositions } from 'client/typings/game.typings';
import { Game } from 'shared/typings/models/game';
import { useAppSelector } from 'client/utils/hooks';

export interface Props {
  updateSelectedGames: Function;
  availableGames: readonly Game[];
  selectedGames: readonly Game[];
}

export const DragAndDropList: FC<Props> = (props: Props): ReactElement => {
  const { availableGames, selectedGames, updateSelectedGames } = props;
  const { t } = useTranslation();

  const groupCode = useAppSelector((state) => state.login.groupCode);
  const groupMembers = useAppSelector((state) => state.login.groupMembers);

  const [warningVisible, setWarningVisible] = React.useState<boolean>(false);
  const [warning, setWarning] = React.useState<string>('');

  const getList = (id: string): readonly Game[] => {
    if (id === 'availableGames') return availableGames;
    else if (id === 'selectedGames') return selectedGames;
    return [];
  };

  const showWarning = async (message: string): Promise<void> => {
    setWarning(message);
    setWarningVisible(true);
    await sleep(config.MESSAGE_DELAY);
    setWarningVisible(false);
    setWarning('');
  };

  const onDragEnd = (result: DropResult): void => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped to same list
    if (source.droppableId === destination.droppableId) {
      const newOrder = getList(source.droppableId);
      if (!newOrder) return;
      const updatedPositions = reorder(
        newOrder,
        source.index,
        destination.index
      );

      if (source.droppableId === 'selectedGames') {
        updateSelectedGames(updatedPositions);
      }
    }

    // Moved to new list
    else {
      const newItemsSource = getList(source.droppableId);
      const newItemsDestination = getList(destination.droppableId);

      if (!newItemsSource || !newItemsDestination) return;

      const updatedPositions: DnDUpdatedPositions = move(
        newItemsSource,
        newItemsDestination,
        source,
        destination
      );

      if (
        destination.droppableId === 'selectedGames' &&
        selectedGames.length >= 3
      ) {
        showWarning('gameLimitWarning');
        return;
      }

      if (
        groupCode !== '0' &&
        updatedPositions.selectedGames &&
        destination.droppableId === 'selectedGames' &&
        updatedPositions.selectedGames[destination.index].maxAttendance <
          groupMembers.length
      ) {
        showWarning('groupTooBigWarning');
        return;
      }

      if (updatedPositions.selectedGames) {
        updateSelectedGames(updatedPositions.selectedGames);
      }
    }
  };

  return (
    <>
      {warningVisible && <ErrorMessage>{t(warning)}</ErrorMessage>}
      <DropRows>
        <DragDropContext onDragEnd={onDragEnd}>
          <AvailableGamesRow>
            <DropRow
              droppableId='availableGames'
              games={availableGames}
              label={t('signupView.signupOpenGames')}
              showCount={false}
            />
          </AvailableGamesRow>
          <SelectedGamesRow>
            <DropRow
              droppableId='selectedGames'
              games={selectedGames}
              label={t('signupView.selectedGames')}
              showCount
            />
          </SelectedGamesRow>
        </DragDropContext>
      </DropRows>
    </>
  );
};

const ErrorMessage = styled.p`
  color: ${(props) => props.theme.error};
`;

const DropRows = styled.div`
  display: flex;
  flex: 1 0 auto;
  flex-direction: row;
`;

const AvailableGamesRow = styled.div`
  margin: 0 10px 0 0;
  width: 50%;
`;

const SelectedGamesRow = styled.div`
  width: 50%;
`;
