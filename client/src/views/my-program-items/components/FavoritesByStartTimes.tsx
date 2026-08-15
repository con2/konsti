import { Fragment, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { capitalize, groupBy } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { getWeekdayAndTime } from "shared/utils/timeFormatter";
import { AppRoute } from "client/app/AppRoutes";
import { TertiaryButton } from "client/components/TertiaryButton";
import { updateFavorite } from "client/utils/favorite";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  MyProgramButtonContainer,
  MyProgramGameTitle,
  MyProgramList,
  MyProgramListItem,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";

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
    (favoriteProgramItem) => favoriteProgramItem.startTime,
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
