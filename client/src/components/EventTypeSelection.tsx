import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { ProgramType } from "shared/typings/models/game";
import { Button, ButtonStyle } from "client/components/Button";
import { setActiveProgramType } from "client/views/admin/adminSlice";

export const ProgramTypeSelection = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const programTypes = Object.values(ProgramType);

  return (
    <>
      {programTypes.map((programType) => {
        return (
          <Button
            key={programType}
            onClick={() => dispatch(setActiveProgramType(programType))}
            buttonStyle={
              activeProgramType === programType
                ? ButtonStyle.DISABLED
                : ButtonStyle.NORMAL
            }
          >
            {t(`programType.${programType}`)}
          </Button>
        );
      })}
    </>
  );
};
