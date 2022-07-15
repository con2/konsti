import React, { ChangeEvent, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Dropdown } from "client/components/Dropdown";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetSignupStrategy } from "client/views/admin/adminThunks";
import { config } from "client/config";

export const SignupStrategySelector = (): ReactElement | null => {
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const strategies = [
    { value: SignupStrategy.DIRECT, title: t("strategies.direct") },
    { value: SignupStrategy.ALGORITHM, title: t("strategies.algorithm") },
    {
      value: SignupStrategy.ALGORITHM_AND_DIRECT,
      title: t("strategies.algorithm+direct"),
    },
  ];

  if (!config.enableStrategyTestValue) {
    return null;
  }

  return (
    <div>
      <span>{t("testValues.strategy")}</span>{" "}
      <Dropdown
        items={strategies}
        selectedValue={signupStrategy as string}
        onChange={async (event: ChangeEvent<HTMLSelectElement>) => {
          setLoading(true);
          await dispatch(
            submitSetSignupStrategy(event.target.value as SignupStrategy)
          );
          setLoading(false);
        }}
        loading={loading}
      />
    </div>
  );
};
