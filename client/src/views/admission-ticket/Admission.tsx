import {RaisedCard} from "client/components/RaisedCard";
import {ReactElement} from "react";
import {ProgramItem} from "shared/types/models/programItem";
import styled from "styled-components";
import {config} from "shared/config";
import {useTranslation} from "react-i18next";

interface Props {
  programItem: ProgramItem,
  isSignedUp: boolean
}

export const Admission = ({programItem, isSignedUp}: Props): ReactElement => {
  const { t } = useTranslation();
  const { conventionName, conventionYear } = config.shared();

  return (
    <RaisedCard>
      <TextContainer>
        {isSignedUp &&
          <>
            <h1>
              {t("appDescription", {
                CONVENTION_NAME: conventionName,
                CONVENTION_YEAR: conventionYear,
              })}
            </h1>
            <p>
              {programItem?.title}
            </p>
          </>}
      </TextContainer>
    </RaisedCard>
  )
}

const TextContainer = styled.div`
  text-align: center;
`
