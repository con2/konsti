import { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MySignupsList } from "client/views/my-games/components/MySignupsList";
import { MyFavoritesList } from "client/views/my-games/components/MyFavoritesList";
import { MyEnteredList } from "client/views/my-games/components/MyEnteredList";
import {
  getSignedGames,
  getUpcomingEnteredGames,
  getUpcomingFavorites,
} from "client/utils/getUpcomingGames";
import { loadUser, loadGames, loadGroupMembers } from "client/utils/loadData";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { ChangePasswordForm } from "client/views/helper/components/ChangePasswordForm";
import { ProgramType } from "shared/typings/models/game";
import {
  selectEnteredGames,
  selectFavoritedGames,
  selectSignedGames,
} from "client/views/my-games/myGamesSlice";
import { RadioButton } from "client/components/RadioButton";

export const MyGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const serial = useAppSelector((state) => state.login.serial);
  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const signedGames = useAppSelector(selectSignedGames);
  const favoritedGames = useAppSelector(selectFavoritedGames);
  const enteredGames = useAppSelector(selectEnteredGames);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const [showAllGames, setShowAllGames] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);

  const store = useStore();

  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await loadGames();
      await loadUser();
      await loadGroupMembers();
    };
    fetchData();
  }, [store, testTime]);

  return (
    <MyGamesViewContainer>
      <RadioButtonGroup>
        <RadioButton
          checked={!showAllGames}
          id={"upcoming"}
          label={t("lastStartedAndUpcoming")}
          onChange={() => setShowAllGames(false)}
        />
        <RadioButton
          checked={showAllGames}
          id={"all"}
          label={t("all")}
          onChange={() => setShowAllGames(true)}
        />
      </RadioButtonGroup>

      <MyFavoritesList
        favoritedGames={
          showAllGames ? favoritedGames : getUpcomingFavorites(favoritedGames)
        }
      />
      {signupStrategy !== SignupStrategy.DIRECT &&
        activeProgramType === ProgramType.TABLETOP_RPG && (
          <MySignupsList
            signedGames={getSignedGames({
              signedGames,
              groupCode,
              serial,
              getAllGames: showAllGames,
              groupMembers,
              activeProgramType,
            })}
            isGroupCreator={isGroupCreator}
          />
        )}
      <MyEnteredList
        enteredGames={
          showAllGames ? enteredGames : getUpcomingEnteredGames(enteredGames)
        }
        signedGames={getSignedGames({
          signedGames,
          groupCode,
          serial,
          getAllGames: showAllGames,
          groupMembers,
          activeProgramType,
        })}
        activeProgramType={activeProgramType}
      />
      <ChangePasswordButton
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={() => setShowChangePassword(!showChangePassword)}
        aria-label={
          showChangePassword
            ? t("iconAltText.closeChangePassword")
            : t("iconAltText.openChangePassword")
        }
      >
        <>
          <AngleIcon
            icon={showChangePassword ? "angle-up" : "angle-down"}
            aria-hidden="true"
          />
          {t("myProgramView.changePassword")}
        </>
      </ChangePasswordButton>
      {showChangePassword && <ChangePasswordForm username={username} />}
    </MyGamesViewContainer>
  );
};

const MyGamesViewContainer = styled.div`
  margin: 8px 16px 8px 16px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 0;
    margin-right: 0;
  }
`;

const ChangePasswordButton = styled(Button)`
  margin: 30px 0 0 0;
`;

const AngleIcon = styled(FontAwesomeIcon)`
  margin: 0 10px 0 0;
  font-size: 18px;
`;

const RadioButtonGroup = styled.fieldset`
  border: none;
  margin-bottom: -8px;
  padding-left: 0;
  display: flex;
  flex-direction: column;
`;
