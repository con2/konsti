import React, { ReactElement } from "react";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Dropdown } from "client/components/Dropdown";

export const TestStrategySelector = (): ReactElement => {
  const { t } = useTranslation();

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
        selectedValue={_.first(strategies)?.value ?? ""}
        onChange={() => {}}
      />
    </div>
  );
};
