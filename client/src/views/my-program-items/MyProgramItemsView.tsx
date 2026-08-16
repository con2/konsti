import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { RadioButton } from "client/components/RadioButton";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import { RaisedCard } from "client/components/RaisedCard";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";
import {
  getLotterySignups,
  getUpcomingDirectSignups,
  getUpcomingFavorites,
} from "client/utils/getUpcomingProgramItems";
import { useAppSelector } from "client/utils/hooks";
import {
  SessionStorageValue,
  getSavedShowAllProgramItems,
} from "client/utils/sessionStorage";
import { useTimeNow } from "client/utils/useTimeNow";
import { selectGroupMembers } from "client/views/group/groupSlice";
import { getIsInGroup } from "client/views/group/groupUtils";
import { MyDirectSignupsList } from "client/views/my-program-items/components/MyDirectSignupsList";
import { MyFavoritesList } from "client/views/my-program-items/components/MyFavoritesList";
import { MyLotterySignupsList } from "client/views/my-program-items/components/MyLotterySignupsList";
import {
  selectDirectSignups,
  selectFavoriteProgramItems,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";

export const MyProgramItemsView = (): ReactElement => {
  const { t } = useTranslation();

  const lotterySignups = useAppSelector(selectLotterySignups);
  const favoriteProgramItems = useAppSelector(selectFavoriteProgramItems);
  const directSignups = useAppSelector(selectDirectSignups);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector(selectGroupMembers);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const timeNow = useTimeNow();
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
            : getUpcomingFavorites(favoriteProgramItems, timeNow)
        }
        showAllProgramItems={showAllProgramItems}
        setShowAllProgramItems={setShowAllProgramItems}
      />
      <MyDirectSignupsList
        directSignups={
          showAllProgramItems
            ? directSignups
            : getUpcomingDirectSignups(directSignups, timeNow)
        }
        showAllProgramItems={showAllProgramItems}
        setShowAllProgramItems={setShowAllProgramItems}
      />
      {signupStrategy !== EventSignupStrategy.DIRECT && (
        <MyLotterySignupsList
          lotterySignups={getLotterySignups({
            lotterySignups,
            isGroupCreator,
            showAllProgramItems,
            isInGroup,
            groupMembers,
            timeNow,
          })}
          isGroupCreator={isGroupCreator}
          isGroupMember={isGroupMember}
          showAllProgramItems={showAllProgramItems}
          setShowAllProgramItems={setShowAllProgramItems}
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
