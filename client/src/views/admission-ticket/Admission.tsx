import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize } from "lodash-es";
import { getTime, getWeekdayAndTime } from "client/utils/timeFormatter";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { RaisedCard } from "client/components/RaisedCard";

interface Props {
  programItem: ProgramItem;
  isSignedUp: boolean;
  username: string;
}

export const Admission = ({
  programItem,
  isSignedUp,
  username,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const { conventionName, conventionYear } = config.event();

  const formatTime = (): string => {
    // Note that the dash should be an en dash
    return `${capitalize(getWeekdayAndTime(programItem.startTime))}–${getTime(programItem.endTime)}`;
  };

  return (
    <RaisedCard>
      <TextContainer>
        <Text>
          {t("appDescription", {
            CONVENTION_NAME: conventionName,
            CONVENTION_YEAR: conventionYear,
          })}
        </Text>
        <BoldText>{programItem.title}</BoldText>
        <Text>{formatTime()}</Text>

        {isSignedUp && (
          <>
            <AdmissionIcon icon="circle-check" />
            <Text>
              {t("admissionView.admission")}
              {username}.
            </Text>
          </>
        )}
        {!isSignedUp && (
          <>
            <NoAdmissionIcon icon="ban" />
            <Text>{t("admissionView.noAdmission")}</Text>
          </>
        )}
      </TextContainer>
    </RaisedCard>
  );
};

const textSize = "28px";

const TextContainer = styled.div`
  text-align: center;
`;

const BoldText = styled.p`
  font-size: ${textSize};
  font-weight: 600;
  margin-bottom: -16px;
`;

const Text = styled.p`
  font-size: ${textSize};
`;

const StyledIcon = styled(FontAwesomeIcon)`
  font-size: 48px;
`;

const AdmissionIcon = styled(StyledIcon)`
  color: ${(props) => props.theme.iconDefault};
`;

const NoAdmissionIcon = styled(StyledIcon)`
  color: ${(props) => props.theme.errorColorIcon};
`;
