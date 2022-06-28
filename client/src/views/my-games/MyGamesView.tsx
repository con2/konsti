import React, { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MySignupsList } from "client/views/my-games/components/MySignupsList";
import { MyFavoritesList } from "client/views/my-games/components/MyFavoritesList";
import { MyEnteredList } from "client/views/my-games/components/MyEnteredList";
import {
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
import { getSignedGames } from "client/views/my-games/utils/getSignedGames";
import {
  selectActiveEnteredGames,
  selectActiveFavoritedGames,
  selectActiveSignedGames,
} from "client/views/my-games/myGamesSlice";

export const MyGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const serial = useAppSelector((state) => state.login.serial);
  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const activeSignedGames = useAppSelector(selectActiveSignedGames);
  const activeFavoritedGames = useAppSelector(selectActiveFavoritedGames);
  const activeEnteredGames = useAppSelector(selectActiveEnteredGames);
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
      <div>
        <Button
          onClick={() => setShowAllGames(false)}
          buttonStyle={
            !showAllGames ? ButtonStyle.DISABLED : ButtonStyle.NORMAL
          }
        >
          {t("lastStartedAndUpcomingGames")}
        </Button>
        <Button
          onClick={() => setShowAllGames(true)}
          buttonStyle={showAllGames ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
        >
          {t("allGames")}
        </Button>
      </div>

      <MyFavoritesList
        favoritedGames={
          showAllGames
            ? activeFavoritedGames
            : getUpcomingFavorites(activeFavoritedGames)
        }
      />

      {signupStrategy !== SignupStrategy.DIRECT &&
        activeProgramType === ProgramType.TABLETOP_RPG && (
          <MySignupsList
            signedGames={getSignedGames(
              activeSignedGames,
              groupCode,
              serial,
              showAllGames,
              groupMembers
            )}
            isGroupCreator={isGroupCreator}
          />
        )}

      <MyEnteredList
        enteredGames={
          showAllGames
            ? activeEnteredGames
            : getUpcomingEnteredGames(activeEnteredGames)
        }
        signedGames={getSignedGames(
          activeSignedGames,
          groupCode,
          serial,
          showAllGames,
          groupMembers
        )}
        activeProgramType={activeProgramType}
      />

      <ChangePasswordButton
        buttonStyle={ButtonStyle.NORMAL}
        onClick={() => setShowChangePassword(!showChangePassword)}
      >
        <>
          <AngleIcon icon={showChangePassword ? "angle-up" : "angle-down"} />
          {t("myGamesView.changePassword")}
        </>
      </ChangePasswordButton>

      {showChangePassword && <ChangePasswordForm username={username} />}
    </MyGamesViewContainer>
  );
};

const MyGamesViewContainer = styled.div`
  padding: 8px 16px;
`;

const ChangePasswordButton = styled(Button)`
  margin: 30px 0 0 0;
`;

const AngleIcon = styled(FontAwesomeIcon)`
  margin: 0 10px 0 0;
  font-size: 18px;
`;
