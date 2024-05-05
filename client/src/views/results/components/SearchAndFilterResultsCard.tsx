import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ProgramTypeSelection } from "client/components/ProgramTypeSelection";
import { RadioButton } from "client/components/RadioButton";
import { ControlledInput } from "client/components/ControlledInput";
import { useAppSelector } from "client/utils/hooks";
import { RaisedCard } from "client/components/RaisedCard";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";

export enum ResultsStartingTimeOption {
  ALL = "all",
  LAST_STARTED_AND_UPCOMING = "lastStartedAndUpcoming",
}

interface Props {
  onSelectedStartingTimeChange: Dispatch<SetStateAction<string>>;
  onSearchTermChange: Dispatch<SetStateAction<string>>;
}

export const SearchAndFilterResultsCard = ({
  onSelectedStartingTimeChange,
  onSearchTermChange,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );

  const [selectedStartingTime, setSelectedStartingTime] =
    useState<ResultsStartingTimeOption>(ResultsStartingTimeOption.ALL);
  const [searchTerm, setSearchTerm] = useState<string>("");

  return (
    <Container>
      <InputContainer>
        <StyledLabel htmlFor="programTypeSelection">
          {t("selectedProgramType")}
        </StyledLabel>
        <ProgramTypeSelection id="programTypeSelection" />
      </InputContainer>

      <InputContainer>
        <StyledLegend>{t("startingTime")}</StyledLegend>
        <RadioButtonGroup>
          {Object.entries(ResultsStartingTimeOption).map(([key, val]) => (
            <RadioButton
              id={key}
              key={key}
              label={t(val)}
              checked={selectedStartingTime === val}
              onChange={() => {
                setSelectedStartingTime(val);
                onSelectedStartingTimeChange(val);
              }}
            />
          ))}
        </RadioButtonGroup>
      </InputContainer>

      <InputContainer>
        <StyledLabel htmlFor="find">{t("find")}</StyledLabel>
        <ControlledInput
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            onSearchTermChange(event.target.value);
          }}
          placeholder={t("findTitleOrUsername", {
            PROGRAM_TYPE: t(`programTypeGenetive.${activeProgramType}`),
          })}
          resetValue={() => {
            setSearchTerm("");
            onSearchTermChange("");
          }}
        />
      </InputContainer>
    </Container>
  );
};

const Container = styled(RaisedCard)`
  display: grid;
  row-gap: 16px;
  column-gap: 24px;

  grid-template-columns: 1fr 1fr;
  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    grid-template-columns: 1fr;
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledLabel = styled.label`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;

const StyledLegend = styled.legend`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;
