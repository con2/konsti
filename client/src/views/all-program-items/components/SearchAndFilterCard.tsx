import { Dispatch, ReactElement, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ProgramTypeSelection } from "client/components/ProgramTypeSelection";
import { useAppSelector } from "client/utils/hooks";
import {
  ProgramType,
  Tag,
  Language,
  AgeGroup,
} from "shared/types/models/programItem";
import { MultiSelectDropdown } from "client/components/MultiSelectDropdown";
import { SessionStorageValue } from "client/utils/sessionStorage";
import { ControlledInput } from "client/components/ControlledInput";
import { RadioButton } from "client/components/RadioButton";
import { RevolvingDoorProgramItemsInfo } from "client/views/all-program-items/components/RevolvingDoorProgramItemsInfo";
import { config } from "shared/config";
import { RaisedCard } from "client/components/RaisedCard";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import {
  selectAgeGroups,
  selectLanguages,
  selectTags,
} from "client/views/all-program-items/allProgramItemsSlice";
import { Checkbox } from "client/components/Checkbox";
import { StartingTimeOption } from "client/views/all-program-items/programListUtils";

interface Props {
  selectedTags: (Tag | Language | AgeGroup)[];
  setSelectedTags: Dispatch<SetStateAction<(Tag | Language | AgeGroup)[]>>;
  selectedStartingTime: StartingTimeOption;
  setSelectedStartingTime: Dispatch<SetStateAction<StartingTimeOption>>;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  hideFullItems: boolean;
  setHideFullItems: Dispatch<SetStateAction<boolean>>;
}

export const SearchAndFilterCard = ({
  selectedTags,
  setSelectedTags,
  selectedStartingTime,
  setSelectedStartingTime,
  searchTerm,
  setSearchTerm,
  hideFullItems,
  setHideFullItems,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
  );
  const tagFilters = useAppSelector(selectTags);
  const ageGroupFilters = useAppSelector(selectAgeGroups);
  const languageFilters = useAppSelector(selectLanguages);

  const tagOptions = [
    languageFilters.map((filter) => ({
      value: filter,
      title: t(`programItemLanguage.${filter}`),
    })),
    tagFilters.map((filter) => ({
      value: filter,
      title: t(`tags.${filter}`),
    })),
    ageGroupFilters.map((filter) => ({
      value: filter,
      title: t(`ageGroup.${filter}`),
    })),
  ].flat();

  const allProgramItemsLabel = t("allProgramItems", {
    PROGRAM_TYPE: t(`programTypePlural.${activeProgramType}`),
  });

  const toggleTag = (value: string): void => {
    const tag = value as Tag | Language | AgeGroup;
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((selected) => selected !== tag)
      : [...selectedTags, tag];
    setSelectedTags(nextTags);
    sessionStorage.setItem(
      SessionStorageValue.ALL_PROGRAM_ITEMS_TAG,
      JSON.stringify(nextTags),
    );
  };

  const clearTags = (): void => {
    setSelectedTags([]);
    sessionStorage.removeItem(SessionStorageValue.ALL_PROGRAM_ITEMS_TAG);
  };

  return (
    <Container>
      <InputContainer>
        <StyledLabel htmlFor="programTypeSelection">
          {t("selectedProgramType")}
        </StyledLabel>
        <StyledProgramTypeSelection id="programTypeSelection" />
      </InputContainer>

      {config.event().enableTagDropdown && (
        <InputContainer>
          <StyledLabel htmlFor="tagSelection">{t("chooseTag")}</StyledLabel>
          <MultiSelectDropdown
            id="tagSelection"
            options={tagOptions}
            selectedValues={selectedTags}
            onToggle={toggleTag}
            onClear={clearTags}
            placeholder={allProgramItemsLabel}
          />
        </InputContainer>
      )}

      <InputContainer>
        <StyledLegend>{t("startingTime")}</StyledLegend>
        <RadioButtonGroup>
          {Object.entries(StartingTimeOption)
            .filter(([_, val]) =>
              config.event().enableRevolvingDoor
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
          placeholder={t(
            activeProgramType === ProgramType.TABLETOP_RPG
              ? "searchWithTitleOrSystem"
              : "searchWithTitle",
            {
              PROGRAM_TYPE: t(`programTypeGenetive.${activeProgramType}`),
            },
          )}
          resetValue={() => {
            setSearchTerm("");
          }}
        />
      </InputContainer>
      <InputContainer>
        <Checkbox
          checked={hideFullItems}
          onChange={() => {
            const nextValue = !hideFullItems;
            setHideFullItems(nextValue);
            sessionStorage.setItem(
              SessionStorageValue.ALL_PROGRAM_ITEMS_HIDE_FULL,
              JSON.stringify(nextValue),
            );
          }}
          id="hide-full-items"
          label={t("hideFullItems")}
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

// Font Awesome free solid chevron-down as an inline background, so the select
// shows the exact same caret as the MultiSelectDropdown next to it
const chevronDownBackground = (color: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='${color}' d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'/></svg>`,
  )}")`;

// Match the height and caret of the tag filter next to it
const StyledProgramTypeSelection = styled(ProgramTypeSelection)`
  height: 38px;
  padding-right: 26px;
  appearance: none;
  background-image: ${(props) => chevronDownBackground(props.theme.textMain)};
  background-repeat: no-repeat;
  background-position: right 7px center;
  background-size: 12px;
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
