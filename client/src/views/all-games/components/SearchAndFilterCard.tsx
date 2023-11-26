import {
  ChangeEvent,
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ProgramTypeSelection } from "client/components/ProgramTypeSelection";
import { useAppSelector } from "client/utils/hooks";
import { ProgramType, Tag, Language } from "shared/typings/models/game";
import { Dropdown } from "client/components/Dropdown";
import { SessionStorageValue } from "client/utils/localStorage";
import { ControlledInput } from "client/components/ControlledInput";
import { RadioButton } from "client/components/RadioButton";
import { RevolvingDoorGamesInfo } from "client/views/all-games/components/RevolvingDoorGamesInfo";
import { config } from "shared/config";
import { RaisedCard } from "client/components/RaisedCard";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";

export enum StartingTimeOption {
  UPCOMING = "upcoming",
  ALL = "all",
  REVOLVING_DOOR = "revolvingDoor",
}

interface Props {
  onTagChange: Dispatch<SetStateAction<string>>;
  onSelectedStartingTimeChange: Dispatch<SetStateAction<StartingTimeOption>>;
  onSearchTermChange: Dispatch<SetStateAction<string>>;
}

export const SearchAndFilterCard = ({
  onTagChange,
  onSelectedStartingTimeChange,
  onSearchTermChange,
}: Props): ReactElement => {
  const tagFilters = [
    Tag.BEGINNER_FRIENDLY,
    Tag.CHILDREN_FRIENDLY,
    // Tag.AIMED_AT_CHILDREN_UNDER_13,
    // Tag.AIMED_AT_CHILDREN_BETWEEN_13_17,
    // Tag.AIMED_AT_ADULT_ATTENDEES,
    Tag.FOR_18_PLUS_ONLY,
  ];
  const languageFilters: Language[] = [Language.FINNISH, Language.ENGLISH];

  const { t } = useTranslation();
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType,
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
    languageFilters.map((filter) => ({
      value: filter,
      title: t(`programItemLanguage.${filter}`),
    })),
    tagFilters.map((filter) => ({
      value: filter,
      title: t(`gameTags.${filter}`),
    })),
  ].flat();

  useEffect(() => {
    setSelectedTag(
      sessionStorage.getItem(SessionStorageValue.ALL_GAMES_TAG) ?? "",
    );
    setSelectedStartingTime(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_STARTING_TIME,
      ) as StartingTimeOption) ?? StartingTimeOption.UPCOMING,
    );
    setSearchTerm(
      sessionStorage.getItem(SessionStorageValue.ALL_GAMES_SEARCH_TERM) ?? "",
    );
  }, []);

  return (
    <Container>
      <InputContainer>
        <StyledLabel htmlFor="programTypeSelection">
          {t("selectedProgramType")}
        </StyledLabel>
        <ProgramTypeSelection />
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
                    onSelectedStartingTimeChange(val);
                    sessionStorage.setItem(
                      SessionStorageValue.ALL_GAMES_STARTING_TIME,
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

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const RevolvingDoorGamesInfoContainer = styled.div`
  grid-column: 1/-1;
`;
