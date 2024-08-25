import { Fragment, ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { updateFavorite } from "client/utils/favorite";
import { selectFavoriteProgramItems } from "client/views/my-program-items/myProgramItemsSlice";
import { RaisedCard } from "client/components/RaisedCard";
import { TertiaryButton } from "client/components/TertiaryButton";

interface Props {
  programItems: readonly ProgramItem[];
  startTimes: readonly string[];
}

export const FavoritesByStartTimes = ({
  programItems,
  startTimes,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);
  const favoriteProgramItems = useAppSelector(selectFavoriteProgramItems);

  const removeFavorite = async (programItem: ProgramItem): Promise<void> => {
    await updateFavorite({
      programItem,
      action: "del",
      favoriteProgramItems,
      username,
      dispatch,
    });
  };

  return (
    <>
      {startTimes.map((startTime) => {
        return (
          <Fragment key={startTime}>
            <StyledTime>{capitalize(getWeekdayAndTime(startTime))}</StyledTime>

            <StyledList>
              {programItems.map((programItem) => {
                if (programItem.startTime === startTime) {
                  return (
                    <ProgramItemDetailsRow key={programItem.programItemId}>
                      <RaisedCard>
                        <GameTitle>{programItem.title}</GameTitle>
                        <ButtonContainer>
                          <TertiaryButton
                            icon="circle-arrow-right"
                            onClick={() => {
                              navigate(
                                `/program/item/${programItem.programItemId}`,
                              );
                            }}
                          >
                            {t("button.showInfo")}
                          </TertiaryButton>
                          <TertiaryButton
                            onClick={async () => {
                              await removeFavorite(programItem);
                            }}
                            icon={["far", "heart"]}
                          >
                            {t("button.unfavorite")}
                          </TertiaryButton>
                        </ButtonContainer>
                      </RaisedCard>
                    </ProgramItemDetailsRow>
                  );
                }
              })}
            </StyledList>
          </Fragment>
        );
      })}
    </>
  );
};

const ProgramItemDetailsRow = styled.li`
  align-items: center;
  justify-content: left;
  margin-bottom: 8px;
  list-style: none;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    justify-content: space-between;
  }
`;

const StyledList = styled.ul`
  margin: 0;
`;

const StyledTime = styled.h2`
  margin: 12px 0 4px 0;
  font-size: ${(props) => props.theme.fontSizeNormal};
`;

const GameTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizeNormal};
  font-weight: normal;
  margin-top: 0;
  margin-bottom: 8px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
`;

