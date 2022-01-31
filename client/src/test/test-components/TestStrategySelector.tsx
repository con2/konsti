import React, { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Dropdown } from "client/components/Dropdown";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetSignupStrategy } from "client/views/admin/adminThunks";

export const TestStrategySelector = (): ReactElement => {
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const strategies = [
    { value: SignupStrategy.DIRECT, title: t("strategies.direct") },
    { value: SignupStrategy.ALGORITHM, title: t("strategies.algorithm") },
    {
      value: SignupStrategy.DIRECT_ALGORITHM,
      title: t("strategies.direct+algorithm"),
    },
  ];

  return (
    <div>
      <span>{t("testValues.strategy")}</span>{" "}
      <Dropdown
        items={strategies}
        selectedValue={signupStrategy}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          dispatch(
            submitSetSignupStrategy(event.target.value as SignupStrategy)
          )
        }
      />
    </div>
  );
};
