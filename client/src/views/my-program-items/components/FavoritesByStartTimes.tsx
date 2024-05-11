import { Fragment, ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { updateFavorite } from "client/utils/favorite";
import { IconButton } from "client/components/IconButton";
import { selectFavoritedProgramItems } from "client/views/my-program-items/myProgramItemsSlice";
import { AppRoute } from "client/app/AppRoutes";

interface Props {
  programItems: readonly ProgramItem[];
  startTimes: readonly string[];
}

export const FavoritesByStartTimes = ({
  programItems,
  startTimes,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);
  const favoritedProgramItems = useAppSelector(selectFavoritedProgramItems);

  const removeFavorite = async (programItem: ProgramItem): Promise<void> => {
    await updateFavorite({
      programItem,
      action: "del",
      favoritedProgramItems,
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

            <ul>
              {programItems.map((programItem) => {
                if (programItem.startTime === startTime) {
                  return (
                    <ProgramItemDetailsRow key={programItem.programItemId}>
                      <StyledLink
                        to={`${AppRoute.PROGRAM_ITEM}/${programItem.programItemId}`}
                        data-testid={"program-item-title"}
                      >
                        {programItem.title}
                      </StyledLink>
                      <IconButton
                        icon="heart-circle-xmark"
                        onClick={async () => {
                          await removeFavorite(programItem);
                        }}
                        ariaLabel={t("iconAltText.deleteFavorite")}
                      />
                    </ProgramItemDetailsRow>
                  );
                }
              })}
            </ul>
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

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;

const StyledLink = styled(Link)`
  margin-right: 8px;
`;
