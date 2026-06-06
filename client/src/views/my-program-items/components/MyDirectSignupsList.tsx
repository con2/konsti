import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy, unique } from "remeda";
import { DirectSignupsByStartTimes } from "./DirectSignupsByStartTimes";
import { RaisedCard } from "client/components/RaisedCard";
import {
  EmptyContentContainer,
  MyProgramHeader,
  MyProgramSecondaryText,
  ShowAllButton,
} from "client/views/my-program-items/components/shared";
import { DirectSignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";

interface Props {
  directSignups: readonly DirectSignupWithProgramItem[];
  showAllProgramItems: boolean;
  setShowAllProgramItems: (showAllProgramItems: boolean) => void;
}

export const MyDirectSignupsList = ({
  directSignups,
  showAllProgramItems,
  setShowAllProgramItems,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [startTimes, setStartTimes] = useState<string[]>([]);

  useEffect(() => {
    const directSignupStartTimes = directSignups.map(
      (directSignup) => directSignup.programItem.startTime,
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartTimes(directSignupStartTimes);
  }, [directSignups]);

  return (
    <RaisedCard data-testid="direct-signup-program-items-list">
      <MyProgramHeader>{t("directSignups")}</MyProgramHeader>
      {startTimes.length === 0 && (
        <EmptyContentContainer>
          <MyProgramSecondaryText>
            {showAllProgramItems
              ? t("noDirectSignups")
              : t("noFutureDirectSignups")}
          </MyProgramSecondaryText>
          {!showAllProgramItems && (
            <ShowAllButton
              onClick={() => setShowAllProgramItems(!showAllProgramItems)}
            >
              {t("showAllProgramItems")}
            </ShowAllButton>
          )}
        </EmptyContentContainer>
      )}

      {startTimes.length > 0 && (
        <DirectSignupsByStartTimes
          directSignups={sortBy(
            directSignups,
            (directSignup) => directSignup.signedToStartTime,
          )}
          startTimes={unique(startTimes).sort()}
        />
      )}
    </RaisedCard>
  );
};
