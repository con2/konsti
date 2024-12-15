import { Fragment, ReactElement } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { updateFavorite } from "client/utils/favorite";
import { selectFavoriteProgramItems } from "client/views/my-program-items/myProgramItemsSlice";
import { TertiaryButton } from "client/components/TertiaryButton";
import {
  MyProgramButtonContainer,
  MyProgramGameTitle,
  MyProgramList,
  MyProgramListItem,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";
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
            <MyProgramTime>
              {capitalize(getWeekdayAndTime(startTime))}
            </MyProgramTime>

            <MyProgramList>
              {programItems.map((programItem) => {
                if (programItem.startTime === startTime) {
                  return (
                    <MyProgramListItem key={programItem.programItemId}>
                      <MyProgramGameTitle data-testid="program-item-title">
                        {programItem.title}
                      </MyProgramGameTitle>
                      <MyProgramButtonContainer>
                        <TertiaryButton
                          icon="circle-arrow-right"
                          onClick={async () => {
                            await navigate(
                              `${AppRoute.PROGRAM_ITEM}/${programItem.programItemId}`,
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
                      </MyProgramButtonContainer>
                    </MyProgramListItem>
                  );
                }
              })}
            </MyProgramList>
          </Fragment>
        );
      })}
    </>
  );
};
