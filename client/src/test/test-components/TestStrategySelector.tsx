import React, { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Dropdown } from "client/components/Dropdown";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetTestStrategyAsync } from "client/views/admin/adminSlice";

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

  const setTestStrategy = (strategy: SignupStrategy): void => {
    dispatch(submitSetTestStrategyAsync(strategy));
  };

  return (
    <div>
      <span>{t("testValues.strategy")}</span>{" "}
      <Dropdown
        items={strategies}
        selectedValue={signupStrategy}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          setTestStrategy(event.target.value as SignupStrategy)
        }
      />
    </div>
  );
};
