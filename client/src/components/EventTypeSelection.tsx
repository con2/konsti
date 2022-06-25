import React, { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { ProgramType } from "shared/typings/models/game";
import { setActiveProgramType } from "client/views/admin/adminSlice";
import { Dropdown } from "client/components/Dropdown";

export const ProgramTypeSelection = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const programTypes = Object.values(ProgramType);

  const dropdownItems = programTypes.map((programType) => ({
    value: programType,
    title: t(`programType.${programType}`),
  }));

  return (
    <>
      <InfoText>{t("selectedProgramType")}</InfoText>
      <Dropdown
        items={dropdownItems}
        selectedValue={activeProgramType}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          dispatch(setActiveProgramType(event.target.value as ProgramType))
        }
        loading={false}
      />
    </>
  );
};

const InfoText = styled.span`
  margin-right: 8px;
`;
