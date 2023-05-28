import React, { ChangeEvent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ProgramTypeSelection } from "client/components/EventTypeSelection";
import { useAppSelector } from "client/utils/hooks";
import { ProgramType, Tag } from "shared/typings/models/game";
import { Dropdown } from "client/components/Dropdown";
import { SessionStorageValue } from "client/utils/localStorage";
import { ControlledInput } from "client/components/ControlledInput";
import { RadioButton } from "client/components/RadioButton";
import { RevolvingDoorGamesInfo } from "client/views/all-games/components/RevolvingDoorGamesInfo";

export enum StartingTimeOption {
  UPCOMING = "upcoming",
  ALL = "all",
  REVOLVING_DOOR = "revolvingDoor",
}

interface Props {
  onTagChange: React.Dispatch<React.SetStateAction<string>>;
  onSelectedStartingTimeChange: React.Dispatch<React.SetStateAction<string>>;
  onSearchTermChange: React.Dispatch<React.SetStateAction<string>>;
}

export const SearchAndFilterCard = ({
  onTagChange,
  onSelectedStartingTimeChange,
  onSearchTermChange,
}: Props): ReactElement => {
  const filters = [
    Tag.IN_ENGLISH,
    Tag.BEGINNER_FRIENDLY,
    Tag.SUITABLE_UNDER_10,
    Tag.AGE_RESTRICTED,
  ];

  const { t } = useTranslation();
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedStartingTime, setSelectedStartingTime] =
    useState<StartingTimeOption>(StartingTimeOption.UPCOMING);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const tagOptions = [
    {
      value: "",
      title: t("allProgramItems", {
        PROGRAM_TYPE: t(`programTypePlural.${activeProgramType}`),
      }),
    },
    filters.map((filter) => ({
      value: filter,
      title: t(`gameTags.${filter}`),
    })),
  ].flat();

  useEffect(() => {
    setSelectedTag(
      sessionStorage.getItem(SessionStorageValue.ALL_GAMES_TAG) ?? ""
    );
    setSelectedStartingTime(
      (sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_STARTING_TIME
      ) as StartingTimeOption) ?? StartingTimeOption.UPCOMING
    );
    setSearchTerm(
      sessionStorage.getItem(SessionStorageValue.ALL_GAMES_SEARCH_TERM) ?? ""
    );
  }, []);

  return (
    <Container>
      <InputContainer>
        <StyledLabel htmlFor="programTypeSelection">
          {t("selectedProgramType")}
        </StyledLabel>
        <ProgramTypeSelection id="programTypeSelection" />
      </InputContainer>

      <InputContainer>
        <StyledLabel htmlFor="tagSelection">{t("chooseTag")}</StyledLabel>
        <Dropdown
          id="tagSelection"
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const tag = event.target.value;
            onTagChange(tag);
            setSelectedTag(tag);
            sessionStorage.setItem(SessionStorageValue.ALL_GAMES_TAG, tag);
          }}
          options={tagOptions}
          selectedValue={selectedTag}
        />
      </InputContainer>

      <InputContainer>
        <StyledLabel htmlFor="startingTimeSelection">
          {t("startingTime")}
        </StyledLabel>
        <RadioButtonGroup id="startingTimeSelection">
          {Object.keys(StartingTimeOption).map((option) => (
            <RadioButton
              id={option}
              key={option}
              label={t(StartingTimeOption[option])}
              checked={selectedStartingTime === StartingTimeOption[option]}
              onChange={() => {
                setSelectedStartingTime(
                  StartingTimeOption[option] as StartingTimeOption
                );
                onSelectedStartingTimeChange(
                  StartingTimeOption[option] as String
                );
                sessionStorage.setItem(
                  SessionStorageValue.ALL_GAMES_STARTING_TIME,
                  StartingTimeOption[option] as StartingTimeOption
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
          placeholder={
            activeProgramType === ProgramType.TABLETOP_RPG
              ? t("searchWithTitleOrSystem", {
                  PROGRAM_TYPE: t(`programTypeGenetive.${activeProgramType}`),
                })
              : t("searchWithTitle", {
                  PROGRAM_TYPE: t(`programTypeGenetive.${activeProgramType}`),
                })
          }
          resetValue={() => {
            setSearchTerm("");
            onSearchTermChange("");
          }}
        />
      </InputContainer>
      {selectedStartingTime === StartingTimeOption.REVOLVING_DOOR && (
        <RevolvingDoorGamesInfoContainer>
          <RevolvingDoorGamesInfo />
        </RevolvingDoorGamesInfoContainer>
      )}
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

const RadioButtonGroup = styled.fieldset`
  border: none;
  margin: -6px 0 -8px 0;
  padding-left: 0;
  display: flex;
  flex-direction: column;
`;

const StyledLabel = styled.label`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const RevolvingDoorGamesInfoContainer = styled.div`
  grid-column: 1/-1;
`;
