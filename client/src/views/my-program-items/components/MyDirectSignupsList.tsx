import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sortBy, uniq } from "lodash-es";
import { DirectSignupsByStartTimes } from "./DirectSignupsByStartTimes";
import { getMissedSignups } from "client/views/my-program-items/utils/getMissedSignups";
import { Signup } from "shared/types/models/user";
import { config } from "shared/config";
import { RaisedCard } from "client/components/RaisedCard";
import {
  MyProgramHeader,
  MyProgramSecondaryText,
} from "client/views/my-program-items/components/shared";

interface Props {
  directSignups: readonly Signup[];
  lotterySignups: readonly Signup[];
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
    setStartTimes(
      directSignups
        .map((directSignup) => directSignup.programItem.startTime)
        .concat(missedSignups),
    );
  }, [missedSignups, directSignups]);

  return (
    <RaisedCard>
      <MyProgramHeader>{t("directSignups")}</MyProgramHeader>
      {(!config.event().resultsVisible || startTimes.length === 0) && (
        <MyProgramSecondaryText>{t("noDirectSignups")}</MyProgramSecondaryText>
      )}

      {config.event().resultsVisible && startTimes.length !== 0 && (
        <DirectSignupsByStartTimes
          directSignups={sortBy(directSignups, [
            (directSignup) => directSignup.time,
          ])}
          startTimes={uniq(startTimes).sort()}
          missedSignups={missedSignups}
        />
      )}
    </RaisedCard>
  );
};
