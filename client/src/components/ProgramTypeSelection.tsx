import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";
import { isEnumValue } from "shared/utils/isEnumValue";
import { MultiSelectDropdown } from "client/components/MultiSelectDropdown";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { saveSession } from "client/utils/localStorage";
import { setActiveProgramTypes } from "client/views/admin/adminSlice";

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
        if (!isEnumValue(ProgramType, value)) {
          return;
        }
        setProgramTypes(
          activeProgramTypes.includes(value)
            ? activeProgramTypes.filter((selected) => selected !== value)
            : [...activeProgramTypes, value],
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
