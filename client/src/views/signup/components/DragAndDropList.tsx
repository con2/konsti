import React, { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { DropRow } from "client/views/signup/components/DropRow";
import { reorder, move } from "client/utils/dragAndDrop";
import { sleep } from "client/utils/sleep";
import { config } from "client/config";
import { DnDUpdatedPositions } from "client/views/signup/signupTypes";
import { Game } from "shared/typings/models/game";
import { useAppSelector } from "client/utils/hooks";

enum Warning {
  GAME_LIMIT = "gameLimitWarning",
  GROUP_TOO_BIG = "group.groupTooBigWarning",
  EMPTY = "",
}

export interface Props {
  updateSelectedGames: (newSelectedGames: readonly Game[]) => void;
  availableGames: readonly Game[];
  selectedGames: readonly Game[];
}

export const DragAndDropList = ({
  updateSelectedGames,
  availableGames,
  selectedGames,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);

  const [warningVisible, setWarningVisible] = useState<boolean>(false);
  const [warning, setWarning] = useState<Warning>(Warning.EMPTY);

  const getList = (id: string): readonly Game[] => {
    if (id === "availableGames") return availableGames;
    else if (id === "selectedGames") return selectedGames;
    return [];
  };

  const showWarning = async (message: Warning): Promise<void> => {
    setWarning(message);
    setWarningVisible(true);
    await sleep(config.MESSAGE_DELAY);
    setWarningVisible(false);
    setWarning(Warning.EMPTY);
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

      if (source.droppableId === "selectedGames") {
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
        destination.droppableId === "selectedGames" &&
        selectedGames.length >= 3
      ) {
        showWarning(Warning.GAME_LIMIT);
        return;
      }

      if (
        groupCode !== "0" &&
        updatedPositions.selectedGames &&
        destination.droppableId === "selectedGames" &&
        updatedPositions.selectedGames[destination.index].maxAttendance <
          groupMembers.length
      ) {
        showWarning(Warning.GROUP_TOO_BIG);
        return;
      }

      if (updatedPositions.selectedGames) {
        updateSelectedGames(updatedPositions.selectedGames);
      }
    }
  };

  return (
    <>
      {warningVisible && warning && <ErrorMessage>{t(warning)}</ErrorMessage>}
      <DropRows>
        <DragDropContext onDragEnd={onDragEnd}>
          <AvailableGamesRow>
            <DropRow
              droppableId="availableGames"
              games={availableGames}
              label={t("signupView.signupOpenGames")}
              showCount={false}
            />
          </AvailableGamesRow>
          <SelectedGamesRow>
            <DropRow
              droppableId="selectedGames"
              games={selectedGames}
              label={t("signupView.selectedGames")}
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
