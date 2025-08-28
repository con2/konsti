import { ReactElement } from "react";
import styled from "styled-components";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ProgramItem, UserSignup } from "shared/types/models/programItem";
import { UserGroup } from "shared/types/models/user";
import { FavoriteButton } from "client/components/FavoriteButton";
import { Tags } from "client/components/Tags";
import { formatProgramItemDuration } from "client/utils/timeFormatter";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { PopularityInfo } from "client/components/PopularityInfo";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { config } from "shared/config";
import { ProgramItemHeadSignupInfo } from "client/views/program-item/head/components/ProgramItemHeadSignupInfo";
import { AppRoute } from "client/app/AppRoutes";
import { SignupQuestion } from "shared/types/models/settings";
import { selectFavoriteProgramItems } from "client/views/my-program-items/myProgramItemsSlice";
import {
  getDirectSignupEnded,
  getDirectSignupInProgress,
  getLotterySignupInProgress,
  getPhaseGapInProgress,
} from "shared/utils/signupTimes";
import { getTimeNow } from "client/utils/getTimeNow";

const updateFavoriteHandler = async (
  updateOpts: UpdateFavoriteOpts,
): Promise<void> => {
  if (!updateOpts.programItem.programItemId) {
    return;
  }
  await updateFavorite(updateOpts);
};

interface Props {
  programItem: ProgramItem;
  signups: UserSignup[];
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  allValuesValid: boolean;
  signupRequired: boolean;
  isDirectSignupMode: boolean;
  publicSignupQuestion: SignupQuestion | undefined;
  cancelled: boolean;
}

export const ProgramItemHead = ({
  programItem,
  signups,
  username,
  loggedIn,
  userGroup,
  allValuesValid,
  signupRequired,
  isDirectSignupMode,
  publicSignupQuestion,
  cancelled,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const favoriteProgramItems = useAppSelector(selectFavoriteProgramItems);
  const isFavorite = favoriteProgramItems.some(
    (favoriteProgramItem) =>
      favoriteProgramItem.programItemId === programItem.programItemId,
  );

  const timeNow = getTimeNow();

  const lotterySignupInProgress = getLotterySignupInProgress(
    programItem,
    timeNow,
  );

  const lotteryPhaseGapInProgress = getPhaseGapInProgress(programItem, timeNow);

  const directSignupInProgress = getDirectSignupInProgress(
    programItem,
    timeNow,
  );
  const directSignupEnded = getDirectSignupEnded(programItem, timeNow);
  const afterLottery =
    lotteryPhaseGapInProgress || directSignupInProgress || directSignupEnded;

  const tags = [];
  if (config.client().programTypeSelectOptions.length > 1) {
    tags.push(t(`programType.${programItem.programType}`));
  }
  if (programItem.gameSystem) {
    tags.push(programItem.gameSystem);
  }
  programItem.languages.map((language) => {
    tags.push(t(`programItemLanguage.${language}`));
  });

  return (
    <Container>
      <div>
        <H3 data-testid="program-item-title">
          <HeaderLink
            to={`${AppRoute.PROGRAM_ITEM}/${programItem.programItemId}`}
          >
            {cancelled
              ? `${t("signup.cancelledTitleText")}: ${programItem.title}`
              : programItem.title}
          </HeaderLink>
        </H3>

        <Tags tags={tags} />

        <Row>
          <span>
            {t("signup.expectedDuration", {
              EXPECTED_DURATION: formatProgramItemDuration(programItem.mins),
            })}
          </span>
          {signupRequired &&
            programItem.minAttendance > 0 &&
            programItem.maxAttendance > 0 && (
              <span>
                {programItem.minAttendance === programItem.maxAttendance
                  ? `${programItem.maxAttendance}`
                  : `${programItem.minAttendance}–${programItem.maxAttendance}`}
                {"\u00A0"}
                {t(
                  `attendeeTypePartitive.${getAttendeeType(programItem.programType)}`,
                )}
              </span>
            )}
          {!!programItem.entryFee &&
            t("signup.entryFee", {
              ENTRY_FEE: programItem.entryFee,
            })}
        </Row>

        {signupRequired && (
          <>
            {allValuesValid && afterLottery && (
              <Row>
                <ProgramItemHeadSignupInfo
                  programItem={programItem}
                  signups={signups}
                  isLoggedIn={loggedIn}
                  isDirectSignupMode={isDirectSignupMode}
                  publicSignupQuestion={publicSignupQuestion}
                />
              </Row>
            )}

            {!isDirectSignupMode && lotterySignupInProgress && (
              <Row>
                <PopularityInfo
                  popularity={programItem.popularity}
                  includeMsg={true}
                  programType={programItem.programType}
                />
              </Row>
            )}
          </>
        )}
      </div>

      {loggedIn && userGroup === UserGroup.USER && !cancelled && (
        <FavoriteButtonContainer>
          <FavoriteButton
            isFavorite={isFavorite}
            onClick={async () =>
              await updateFavoriteHandler({
                programItem,
                action: isFavorite ? "del" : "add",
                favoriteProgramItems,
                username,
                dispatch,
              })
            }
          />
        </FavoriteButtonContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const H3 = styled.h3`
  margin: 8px 0 4px 0;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  margin-top: 12px;
`;

const HeaderLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;

const FavoriteButtonContainer = styled.div`
  margin-top: -4px;
  align-items: flex-start;
`;
