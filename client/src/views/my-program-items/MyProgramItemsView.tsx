import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { MyLotterySignupsList } from "client/views/my-program-items/components/MyLotterySignupsList";
import { MyFavoritesList } from "client/views/my-program-items/components/MyFavoritesList";
import { MyDirectSignupsList } from "client/views/my-program-items/components/MyDirectSignupsList";
import {
  getLotterySignups,
  getUpcomingDirectSignups,
  getUpcomingFavorites,
} from "client/utils/getUpcomingProgramItems";

import { useAppSelector } from "client/utils/hooks";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import {
  selectDirectSignups,
  selectFavoriteProgramItems,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";
import { RadioButton } from "client/components/RadioButton";
import { RaisedCard } from "client/components/RaisedCard";
import {
  SessionStorageValue,
  getSavedShowAllProgramItems,
} from "client/utils/sessionStorage";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import { getIsInGroup } from "client/views/group/groupUtils";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";
import { selectGroupMembers } from "client/views/group/groupSlice";

export const MyProgramItemsView = (): ReactElement => {
  const { t } = useTranslation();

  const lotterySignups = useAppSelector(selectLotterySignups);
  const favoriteProgramItems = useAppSelector(selectFavoriteProgramItems);
  const directSignups = useAppSelector(selectDirectSignups);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector(selectGroupMembers);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);

  const isGroupMember = groupMembers.length > 0;

  const [showAllProgramItems, setShowAllProgramItems] = useState<boolean>(
    getSavedShowAllProgramItems(),
  );

  return (
    <MyProgramItemsViewContainer>
      <RaisedCard>
        <StyledLabel htmlFor="startingTimeSelection">
          {t("startingTime")}
        </StyledLabel>
        <RadioButtonGroup>
          <RadioButton
            checked={!showAllProgramItems}
            id={"upcoming"}
            label={t("lastStartedAndUpcoming")}
            onChange={() => {
              setShowAllProgramItems(false);
              sessionStorage.setItem(
                SessionStorageValue.MY_PROGRAM_ITEMS_SHOW_ALL_PROGRAM_ITEMS,
                "false",
              );
            }}
          />
          <RadioButton
            checked={showAllProgramItems}
            id={"all"}
            label={t("all")}
            onChange={() => {
              setShowAllProgramItems(true);
              sessionStorage.setItem(
                SessionStorageValue.MY_PROGRAM_ITEMS_SHOW_ALL_PROGRAM_ITEMS,
                "true",
              );
            }}
          />
        </RadioButtonGroup>
      </RaisedCard>

      <MyFavoritesList
        favoriteProgramItems={
          showAllProgramItems
            ? favoriteProgramItems
            : getUpcomingFavorites(favoriteProgramItems)
        }
      />
      <MyDirectSignupsList
        directSignups={
          showAllProgramItems
            ? directSignups
            : getUpcomingDirectSignups(directSignups)
        }
        lotterySignups={getLotterySignups({
          lotterySignups,
          isGroupCreator,
          getAllProgramItems: showAllProgramItems,
          isInGroup,
          groupMembers,
        })}
      />
      {signupStrategy !== EventSignupStrategy.DIRECT && (
        <MyLotterySignupsList
          lotterySignups={getLotterySignups({
            lotterySignups,
            isGroupCreator,
            getAllProgramItems: showAllProgramItems,
            isInGroup,
            groupMembers,
          })}
          isGroupCreator={isGroupCreator}
          isGroupMember={isGroupMember}
        />
      )}
      <ScrollToTopButton />
    </MyProgramItemsViewContainer>
  );
};

const MyProgramItemsViewContainer = styled.div`
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
