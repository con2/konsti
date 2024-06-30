import { ChangeEvent, Dispatch, ReactElement, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { uniq } from "lodash-es";
import { ProgramTypeSelection } from "client/components/ProgramTypeSelection";
import { useAppSelector } from "client/utils/hooks";
import {
  ProgramType,
  Tag,
  Language,
  ProgramItem,
} from "shared/types/models/programItem";
import { Dropdown } from "client/components/Dropdown";
import { SessionStorageValue } from "client/utils/sessionStorage";
import { ControlledInput } from "client/components/ControlledInput";
import { RadioButton } from "client/components/RadioButton";
import { RevolvingDoorProgramItemsInfo } from "client/views/all-program-items/components/RevolvingDoorProgramItemsInfo";
import { config } from "shared/config";
import { RaisedCard } from "client/components/RaisedCard";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";

export enum StartingTimeOption {
  UPCOMING = "upcoming",
  ALL = "all",
  REVOLVING_DOOR = "revolvingDoor",
}

const ignoredTags = [Tag.GUEST_OF_HONOR, Tag.THEME_MONSTERS];

const getTagFilters = (programItems: readonly ProgramItem[]): Tag[] => {
  const tags = uniq([
    Tag.BEGINNER_FRIENDLY,
    Tag.ALL_AGES,
    Tag.AIMED_UNDER_13,
    Tag.AIMED_BETWEEN_13_17,
    Tag.AIMED_ADULTS,
    Tag.FOR_18_PLUS_ONLY,
    ...Object.values(Tag),
  ]);
  return tags
    .filter((tag) => {
      return programItems.some((programItem) => programItem.tags.includes(tag));
    })
    .filter((tag) => !ignoredTags.includes(tag));
};

const ignoredLanguages = [Language.LANGUAGE_FREE];

const getLanguageFilters = (
  programItems: readonly ProgramItem[],
): Language[] => {
  const languages = uniq([
    Language.FINNISH,
    Language.ENGLISH,
    Language.SWEDISH,
    ...Object.values(Language),
  ]);
  return languages
    .filter((language) => {
      return programItems.some((programItem) =>
        programItem.languages.includes(language),
      );
    })
    .filter((language) => !ignoredLanguages.includes(language));
};

interface Props {
  selectedTag: Tag | Language | "";
  setSelectedTag: Dispatch<SetStateAction<Tag | Language | "">>;
  selectedStartingTime: StartingTimeOption;
  setSelectedStartingTime: Dispatch<SetStateAction<StartingTimeOption>>;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
}

export const SearchAndFilterCard = ({
  selectedTag,
  setSelectedTag,
  selectedStartingTime,
  setSelectedStartingTime,
  searchTerm,
  setSearchTerm,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );
  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );

  const tagFilters = getTagFilters(programItems);
  const languageFilters = getLanguageFilters(programItems);

  const tagOptions = [
    {
      value: "",
      title: t("allProgramItems", {
        PROGRAM_TYPE: t(`programTypePlural.${activeProgramType}`),
      }),
    },
    languageFilters.map((filter) => ({
      value: filter,
      title: t(`programItemLanguage.${filter}`),
    })),
    tagFilters.map((filter) => ({
      value: filter,
      title: t(`tags.${filter}`),
    })),
  ].flat();

  return (
    <Container>
      <InputContainer>
        <StyledLabel htmlFor="programTypeSelection">
          {t("selectedProgramType")}
        </StyledLabel>
        <ProgramTypeSelection id="programTypeSelection" />
      </InputContainer>

      {config.client().enableTagDropdown && (
        <InputContainer>
          <StyledLabel htmlFor="tagSelection">{t("chooseTag")}</StyledLabel>
          <Dropdown
            id="tagSelection"
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const tag = event.target.value as Tag | Language;
              setSelectedTag(tag);
              sessionStorage.setItem(
                SessionStorageValue.ALL_PROGRAM_ITEMS_TAG,
                tag,
              );
            }}
            options={tagOptions}
            selectedValue={selectedTag}
          />
        </InputContainer>
      )}

      <InputContainer>
        <StyledLegend>{t("startingTime")}</StyledLegend>
        <RadioButtonGroup>
          {Object.entries(StartingTimeOption)
            .filter(([_, val]) =>
              config.client().enableRevolvingDoor
                ? true
                : val !== StartingTimeOption.REVOLVING_DOOR,
            )
            .map(([key, val]) => {
              return (
                <RadioButton
                  checked={selectedStartingTime === val}
                  key={key}
                  id={key}
                  label={t(val)}
                  onChange={() => {
                    setSelectedStartingTime(val);
                    sessionStorage.setItem(
                      SessionStorageValue.ALL_PROGRAM_ITEMS_STARTING_TIME,
                      val,
                    );
                  }}
                />
              );
            })}
        </RadioButtonGroup>
      </InputContainer>

      <InputContainer>
        <StyledLabel htmlFor="find">{t("find")}</StyledLabel>
        <ControlledInput
          id="find"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
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
          }}
        />
      </InputContainer>
      {selectedStartingTime === StartingTimeOption.REVOLVING_DOOR && (
        <RevolvingDoorProgramItemsInfoContainer>
          <RevolvingDoorProgramItemsInfo />
        </RevolvingDoorProgramItemsInfoContainer>
      )}
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

const StyledLabel = styled.label`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;

const StyledLegend = styled.legend`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const RevolvingDoorProgramItemsInfoContainer = styled.div`
  grid-column: 1/-1;
`;
