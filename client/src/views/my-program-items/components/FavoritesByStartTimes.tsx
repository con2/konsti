import { Fragment, ReactElement } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { capitalize, groupBy } from "remeda";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { updateFavorite } from "client/utils/favorite";
import { TertiaryButton } from "client/components/TertiaryButton";
import {
  MyProgramButtonContainer,
  MyProgramGameTitle,
  MyProgramList,
  MyProgramListItem,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";
import { AppRoute } from "client/app/AppRoutes";
import { config } from "shared/config";

interface Props {
  favoriteProgramItems: readonly ProgramItem[];
}

export const FavoritesByStartTimes = ({
  favoriteProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);

  const groupedFavoriteProgramItems = groupBy(
    favoriteProgramItems,
    (favoriteProgramItem) => {
      const parentStartTime = config
        .event()
        .startTimesByParentIds.get(favoriteProgramItem.parentId);
      return parentStartTime ?? favoriteProgramItem.startTime;
    },
  );

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
      {Object.entries(groupedFavoriteProgramItems).map(
        ([startTime, programItems]) => (
          <Fragment key={startTime}>
            <MyProgramTime>
              {capitalize(getWeekdayAndTime(startTime))}
            </MyProgramTime>

            <MyProgramList>
              {programItems.map((programItem) => (
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
              ))}
            </MyProgramList>
          </Fragment>
        ),
      )}
    </>
  );
};
