import { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { ProgramType } from "shared/typings/models/game";
import { setActiveProgramType } from "client/views/admin/adminSlice";
import { Dropdown } from "client/components/Dropdown";
import { saveSession } from "client/utils/localStorage";
import { sharedConfig } from "shared/config/sharedConfig";

export const ProgramTypeSelection = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const programTypes = sharedConfig.activeProgramTypes;

  const dropdownItems = programTypes.map((programType) => ({
    value: programType,
    title: t(`programTypeSelection.${programType}`),
  }));

  return (
    <Dropdown
      options={dropdownItems}
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
  );
};
