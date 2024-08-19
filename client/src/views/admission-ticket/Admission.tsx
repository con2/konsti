import {ReactElement} from "react";
import {ProgramItem} from "shared/types/models/programItem";
import styled from "styled-components";
import {config} from "shared/config";
import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {getTime, getWeekdayAndTime} from "client/utils/timeFormatter";
import {capitalize} from "lodash-es";
import {RaisedCard} from "client/components/RaisedCard";

interface Props {
  programItem: ProgramItem;
  isSignedUp: boolean;
}

export const Admission = ({ programItem, isSignedUp }: Props): ReactElement => {
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
        <BoldText>{programItem?.title}</BoldText>
        <Text>{formatTime()}</Text>

        {isSignedUp &&
          <AdmissionIcon icon="ticket" />}

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

const TextContainer = styled.div`
  text-align: center;
`;

const BoldText = styled.p`
  font-size: ${(props) => props.theme.fontSizeLarger};
  font-weight: 600;
`;

const Text = styled.p`
  font-size: ${(props) => props.theme.fontSizeLarger};
`;

const StyledIcon = styled(FontAwesomeIcon)`
  font-size: ${(props) => props.theme.iconSizeLarger};
`;

const AdmissionIcon = styled(StyledIcon)`
  color: ${(props) => props.theme.iconDefault};
`;

const NoAdmissionIcon = styled(StyledIcon)`
  color: ${(props) => props.theme.errorColorIcon};
`;
