import React, { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ProgramTypeSelection } from "client/components/EventTypeSelection";
import { RadioButton } from "client/components/RadioButton";
import { ControlledInput } from "client/components/ControlledInput";
import { useAppSelector } from "client/utils/hooks";

export enum ResultsStartingTimeOption {
  ALL = "all",
  LAST_STARTED_AND_UPCOMING = "lastStartedAndUpcoming",
}

interface Props {
  onSelectedStartingTimeChange: React.Dispatch<React.SetStateAction<string>>;
  onSearchTermChange: React.Dispatch<React.SetStateAction<string>>;
}

export const SearchAndFilterResultsCard = ({
  onSelectedStartingTimeChange,
  onSearchTermChange,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
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
        <StyledLabel htmlFor="startingTimeSelection">
          {t("startingTime")}
        </StyledLabel>
        <RadioButtonGroup id="startingTimeSelection">
          {Object.keys(ResultsStartingTimeOption).map((option) => (
            <RadioButton
              id={option}
              key={option}
              label={t(ResultsStartingTimeOption[option])}
              checked={
                selectedStartingTime === ResultsStartingTimeOption[option]
              }
              onChange={() => {
                setSelectedStartingTime(
                  ResultsStartingTimeOption[option] as ResultsStartingTimeOption
                );
                onSelectedStartingTimeChange(
                  ResultsStartingTimeOption[option] as String
                );
              }}
            />
          ))}
        </RadioButtonGroup>
      </InputContainer>

      <InputContainer>
        <StyledLabel htmlFor="find">{t("find")}</StyledLabel>
        <ControlledInput
          id="find"
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

const Container = styled.div`
  display: grid;
  row-gap: 16px;
  column-gap: 24px;
  margin: 20px 0 20px 0;
  padding: 16px 8px 16px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  box-shadow: ${(props) => props.theme.shadowLower};

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

const RadioButtonGroup = styled.fieldset`
  border: none;
  margin: -6px 0 -8px 0;
  padding-left: 0;
  display: flex;
  flex-direction: column;
`;
