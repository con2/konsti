import { ReactElement, useEffect, useState } from "react";
import { useStore } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { MySignupsList } from "client/views/my-games/components/MySignupsList";
import { MyFavoritesList } from "client/views/my-games/components/MyFavoritesList";
import { MyEnteredList } from "client/views/my-games/components/MyEnteredList";
import {
  getSignedGames,
  getUpcomingEnteredGames,
  getUpcomingFavorites,
} from "client/utils/getUpcomingGames";
import { loadUser, loadGames, loadGroupMembers } from "client/utils/loadData";
import { useAppSelector } from "client/utils/hooks";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import {
  selectEnteredGames,
  selectFavoritedGames,
  selectSignedGames,
} from "client/views/my-games/myGamesSlice";
import { RadioButton } from "client/components/RadioButton";
import { RaisedCard } from "client/components/RaisedCard";
import {
  SessionStorageValue,
  getSavedShowAllGames,
} from "client/utils/sessionStorage";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import { getIsInGroup } from "client/views/group/groupUtils";

export const MyGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const signedGames = useAppSelector(selectSignedGames);
  const favoritedGames = useAppSelector(selectFavoritedGames);
  const enteredGames = useAppSelector(selectEnteredGames);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);

  const isGroupMember = groupMembers.length > 0;

  const [showAllGames, setShowAllGames] = useState<boolean>(
    getSavedShowAllGames(),
  );
  const store = useStore();

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
      <RaisedCard>
        <StyledLabel htmlFor="startingTimeSelection">
          {t("startingTime")}
        </StyledLabel>
        <RadioButtonGroup>
          <RadioButton
            checked={!showAllGames}
            id={"upcoming"}
            label={t("lastStartedAndUpcoming")}
            onChange={() => {
              setShowAllGames(false);
              sessionStorage.setItem(
                SessionStorageValue.MY_GAMES_SHOW_ALL_GAMES,
                "false",
              );
            }}
          />
          <RadioButton
            checked={showAllGames}
            id={"all"}
            label={t("all")}
            onChange={() => {
              setShowAllGames(true);
              sessionStorage.setItem(
                SessionStorageValue.MY_GAMES_SHOW_ALL_GAMES,
                "true",
              );
            }}
          />
        </RadioButtonGroup>
      </RaisedCard>

      <MyFavoritesList
        favoritedGames={
          showAllGames ? favoritedGames : getUpcomingFavorites(favoritedGames)
        }
      />
      <MyEnteredList
        enteredGames={
          showAllGames ? enteredGames : getUpcomingEnteredGames(enteredGames)
        }
        signedGames={getSignedGames({
          signedGames,
          isGroupCreator,
          getAllGames: showAllGames,
          isInGroup,
          groupMembers,
        })}
      />
      {signupStrategy !== SignupStrategy.DIRECT && (
        <MySignupsList
          signedGames={getSignedGames({
            signedGames,
            isGroupCreator,
            getAllGames: showAllGames,
            isInGroup,
            groupMembers,
          })}
          isGroupCreator={isGroupCreator}
          isGroupMember={isGroupMember}
        />
      )}
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

const StyledLabel = styled.label`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;
