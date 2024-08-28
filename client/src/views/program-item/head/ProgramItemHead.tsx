import { ReactElement } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
  UserSignup,
} from "shared/types/models/programItem";
import { UserGroup } from "shared/types/models/user";
import { FavoriteButton } from "client/components/FavoriteButton";
import { Tags } from "client/components/Tags";
import { formatProgramItemDuration } from "client/utils/timeFormatter";
import { getAttendeeType } from "client/utils/getAttendeeType";
import { PopularityInfo } from "client/components/PopularityInfo";
import { updateFavorite, UpdateFavoriteOpts } from "client/utils/favorite";
import { useAppDispatch } from "client/utils/hooks";
import { config } from "shared/config";
import { ProgramItemHeadSignupInfo } from "client/views/program-item/head/components/ProgramItemHeadSignupInfo";
import { AppRoute } from "client/app/AppRoutes";
import { SignupQuestion } from "shared/types/models/settings";

interface Props {
  programItem: ProgramItem;
  signups: UserSignup[];
  signupStrategy: ProgramItemSignupStrategy;
  username: string;
  loggedIn: boolean;
  userGroup: UserGroup;
  favoriteProgramItems: readonly ProgramItem[];
  publicSignupQuestion?: SignupQuestion;
  allValuesValid: boolean;
  isNormalSignup: boolean;
  requiresSignup: boolean;
}

export const ProgramItemHead = ({
  programItem,
  signups,
  signupStrategy,
  username,
  loggedIn,
  userGroup,
  favoriteProgramItems,
  publicSignupQuestion,
  allValuesValid,
  isNormalSignup,
  requiresSignup,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const signupAlwaysOpen = config
    .event()
    .directSignupAlwaysOpenIds.includes(programItem.programItemId);

  const isEnterGameMode =
    signupStrategy === ProgramItemSignupStrategy.DIRECT || signupAlwaysOpen;

  const isFavorite =
    favoriteProgramItems.find(
      (favoriteProgramItem) =>
        favoriteProgramItem.programItemId === programItem.programItemId,
    ) !== undefined;

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

  const updateFavoriteHandler = async (
    updateOpts: UpdateFavoriteOpts,
  ): Promise<void> => {
    if (!updateOpts.programItem.programItemId) {
      return;
    }
    await updateFavorite(updateOpts);
  };

  return (
    <Container>
      <div>
        <H3 data-testid="program-item-title">
          <HeaderLink
            to={`${AppRoute.PROGRAM_ITEM}/${programItem.programItemId}`}
          >
            {programItem.title}
          </HeaderLink>
        </H3>
        <Tags tags={tags} />
        <Row>
          <span>
            {t("signup.expectedDuration", {
              EXPECTED_DURATION: formatProgramItemDuration(programItem.mins),
            })}
          </span>
          {requiresSignup &&
            programItem.minAttendance > 0 &&
            programItem.maxAttendance > 0 && (
              <span>
                {programItem.minAttendance !== programItem.maxAttendance
                  ? `${programItem.minAttendance}–${programItem.maxAttendance}`
                  : `${programItem.maxAttendance}`}
                {"\u00A0"}
                {t(
                  `attendeeTypePartitive.${getAttendeeType(programItem.programType)}`,
                )}
              </span>
            )}
          {!!programItem.entryFee &&
            t(`signup.entryFee`, {
              ENTRY_FEE: programItem.entryFee,
            })}
        </Row>
        {isNormalSignup && allValuesValid && (
          <Row>
            <ProgramItemHeadSignupInfo
              programItem={programItem}
              signups={signups}
              isLoggedIn={loggedIn}
              publicSignupQuestion={publicSignupQuestion}
            />
          </Row>
        )}

        {signups.length < programItem.minAttendance &&
          isNormalSignup &&
          isEnterGameMode && (
            <Row>
              {t("signup.attendeesNeeded", {
                COUNT: programItem.minAttendance - signups.length,
                ATTENDEE_TYPE:
                  programItem.minAttendance - signups.length === 1
                    ? t(
                        `attendeeType.${getAttendeeType(programItem.programType)}`,
                      )
                    : t(
                        `attendeeTypePartitive.${getAttendeeType(
                          programItem.programType,
                        )}`,
                      ),
              })}
            </Row>
          )}
        {!isEnterGameMode && isNormalSignup && (
          <Row>
            <PopularityInfo
              minAttendance={programItem.minAttendance}
              maxAttendance={programItem.maxAttendance}
              popularity={programItem.popularity}
              includeMsg={true}
              programType={programItem.programType}
            />
          </Row>
        )}
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {loggedIn && userGroup === UserGroup.USER && programItem && (
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
