import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy, unique } from "remeda";
import { DirectSignupsByStartTimes } from "./DirectSignupsByStartTimes";
import { getMissedSignups } from "client/views/my-program-items/utils/getMissedSignups";
import { config } from "shared/config";
import { RaisedCard } from "client/components/RaisedCard";
import {
  MyProgramHeader,
  MyProgramSecondaryText,
} from "client/views/my-program-items/components/shared";
import {
  DirectSignupWithProgramItem,
  LotterySignupWithProgramItem,
} from "client/views/my-program-items/myProgramItemsSlice";

interface Props {
  directSignups: readonly DirectSignupWithProgramItem[];
  lotterySignups: readonly LotterySignupWithProgramItem[];
}

export const MyDirectSignupsList = ({
  directSignups,
  lotterySignups,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [missedSignups, setMissedSignups] = useState<string[]>([]);
  const [startTimes, setStartTimes] = useState<string[]>([]);

  useEffect(() => {
    setMissedSignups(getMissedSignups(lotterySignups, directSignups));
  }, [lotterySignups, directSignups]);

  useEffect(() => {
    const directSignupStartTimes = directSignups.map(
      (directSignup) => directSignup.programItem.startTime,
    );
    setStartTimes([...directSignupStartTimes, ...missedSignups]);
  }, [missedSignups, directSignups]);

  return (
    <RaisedCard data-testid="direct-signup-program-items-list">
      <MyProgramHeader>{t("directSignups")}</MyProgramHeader>
      {(!config.event().resultsVisible || startTimes.length === 0) && (
        <MyProgramSecondaryText>{t("noDirectSignups")}</MyProgramSecondaryText>
      )}

      {config.event().resultsVisible && startTimes.length > 0 && (
        <DirectSignupsByStartTimes
          directSignups={sortBy(
            directSignups,
            (directSignup) => directSignup.signedToStartTime,
          )}
          startTimes={unique(startTimes).sort()}
          missedSignups={missedSignups}
        />
      )}
    </RaisedCard>
  );
};
