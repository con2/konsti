import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { ProgramType } from "shared/types/models/programItem";
import { setActiveProgramTypes } from "client/views/admin/adminSlice";
import { MultiSelectDropdown } from "client/components/MultiSelectDropdown";
import { saveSession } from "client/utils/localStorage";
import { config } from "shared/config";

interface Props {
  id: string;
  className?: string;
}

export const ProgramTypeSelection = ({
  id,
  className,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const activeProgramTypes = useAppSelector(
    (state) => state.admin.activeProgramTypes,
  );

  const options = config.event().activeProgramTypes.map((programType) => ({
    value: programType,
    title: t(`programTypeSelection.${programType}`),
  }));

  const setProgramTypes = (programTypes: readonly ProgramType[]): void => {
    dispatch(setActiveProgramTypes(programTypes));
    saveSession({
      admin: { activeProgramTypes: programTypes },
    });
  };

  return (
    <MultiSelectDropdown
      id={id}
      options={options}
      selectedValues={activeProgramTypes}
      onToggle={(value) => {
        const programType = value as ProgramType;
        setProgramTypes(
          activeProgramTypes.includes(programType)
            ? activeProgramTypes.filter((selected) => selected !== programType)
            : [...activeProgramTypes, programType],
        );
      }}
      onClear={() => {
        setProgramTypes([]);
      }}
      placeholder={t("programTypeSelection.all")}
      testId="program-type-filter"
      className={className}
    />
  );
};
