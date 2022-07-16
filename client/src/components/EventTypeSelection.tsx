import React, { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { ProgramType } from "shared/typings/models/game";
import { setActiveProgramType } from "client/views/admin/adminSlice";
import { Dropdown } from "client/components/Dropdown";
import { saveSession } from "client/utils/localStorage";
import { MOBILE_MARGIN } from "client/globalStyle";

export const ProgramTypeSelection = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const programTypes = Object.values(ProgramType);

  const dropdownItems = programTypes.map((programType) => ({
    value: programType,
    title: t(`programTypePlural.${programType}`),
  }));

  return (
    <EventTypeSelectionContainer>
      <InfoText>{t("selectedProgramType")}</InfoText>
      <Dropdown
        items={dropdownItems}
        selectedValue={activeProgramType}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          const programType = event.target.value as ProgramType;
          dispatch(setActiveProgramType(programType));
          saveSession({
            admin: { activeProgramType: programType },
          });
        }}
        loading={false}
      />
    </EventTypeSelectionContainer>
  );
};

const EventTypeSelectionContainer = styled.div`
  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: ${MOBILE_MARGIN}px;
    margin-right: ${MOBILE_MARGIN}px;
  }
`;

const InfoText = styled.span`
  margin-right: 8px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    display: none;
  }
`;
