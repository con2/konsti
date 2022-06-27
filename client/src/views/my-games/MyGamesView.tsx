import React, { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MySignupsList } from "client/views/my-games/components/MySignupsList";
import { MyFavoritesList } from "client/views/my-games/components/MyFavoritesList";
import { MyEnteredList } from "client/views/my-games/components/MyEnteredList";
import {
  getUpcomingSignedGames,
  getUpcomingEnteredGames,
  getUpcomingFavorites,
} from "client/utils/getUpcomingGames";
import { loadUser, loadGames, loadGroupMembers } from "client/utils/loadData";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { GroupMember } from "shared/typings/api/groups";
import { SelectedGame } from "shared/typings/models/user";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { ChangePasswordForm } from "client/views/helper/components/ChangePasswordForm";
import { ProgramType } from "shared/typings/models/game";

export const MyGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const serial = useAppSelector((state) => state.login.serial);
  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
  );
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
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
          showAllGames ? favoritedGames : getUpcomingFavorites(favoritedGames)
        }
      />

      {signupStrategy !== SignupStrategy.DIRECT &&
        activeProgramType === ProgramType.TABLETOP_RPG && (
          <MySignupsList
            signedGames={getSignedGames(
              signedGames,
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
          showAllGames ? enteredGames : getUpcomingEnteredGames(enteredGames)
        }
        signedGames={getSignedGames(
          signedGames,
          groupCode,
          serial,
          showAllGames,
          groupMembers
        )}
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

const getGroupCreator = (
  groupMembers: readonly GroupMember[]
): GroupMember | null => {
  const groupCreator = groupMembers.find(
    (member) => member.serial === member.groupCode
  );
  if (!groupCreator) return null;
  return groupCreator;
};

const getSignedGames = (
  signedGames: readonly SelectedGame[],
  groupCode: string,
  serial: string,
  showAllGames: boolean,
  groupMembers: readonly GroupMember[]
): readonly SelectedGame[] => {
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  if (isGroupCreator) {
    if (!showAllGames) return getUpcomingSignedGames(signedGames);
    else return signedGames;
  }

  if (!isGroupCreator) {
    const groupCreator = getGroupCreator(groupMembers);

    if (!showAllGames) {
      return getUpcomingSignedGames(
        groupCreator ? groupCreator.signedGames : signedGames
      );
    } else return groupCreator ? groupCreator.signedGames : signedGames;
  }

  return signedGames;
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
