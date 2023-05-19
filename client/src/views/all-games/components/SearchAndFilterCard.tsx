import React, { ChangeEvent, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ProgramTypeSelection } from "client/components/EventTypeSelection";
import { useAppSelector } from "client/utils/hooks";
import { ProgramType, Tag } from "shared/typings/models/game";
import { Dropdown } from "client/components/Dropdown";
import { SessionStorageValue } from "client/utils/localStorage";
import { ControlledInput } from "client/components/ControlledInput";
import { RadioButton } from "client/components/RadioButton";

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

  return (
    <Container>
      <label>{t("selectedProgramType")}</label>
      <ProgramTypeSelection />

      <label>{t("chooseTag")}</label>
      <Dropdown
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          const tag = event.target.value;
          onTagChange(tag);
          setSelectedTag(tag);
          sessionStorage.setItem(SessionStorageValue.ALL_GAMES_TAG, tag);
        }}
        options={tagOptions}
        selectedValue={selectedTag}
      />

      <label>{t("startingTime")}</label>
      <RadioButtonGroup>
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

      <label>{t("find")}</label>
      <ControlledInput
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
        resetValue={() => setSearchTerm("")}
      />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  margin: 20px 0 20px 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  box-shadow: ${(props) => props.theme.shadowLower};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 0;
    margin-right: 0;
  }
`;

const RadioButtonGroup = styled.fieldset`
  border: none;
  margin-left: 0;
  padding-left: 0;
  display: flex;
  flex-direction: column;
`;
