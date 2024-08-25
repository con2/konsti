import { ChangeEvent, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventSignupStrategy } from "shared/config/eventConfigTypes";
import { Dropdown } from "client/components/Dropdown";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetSignupStrategy } from "client/views/admin/adminThunks";

export const SignupStrategySelector = (): ReactElement => {
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const strategies = [
    { value: EventSignupStrategy.DIRECT, title: t("strategies.direct") },
    { value: EventSignupStrategy.LOTTERY, title: t("strategies.lottery") },
    {
      value: EventSignupStrategy.LOTTERY_AND_DIRECT,
      title: t("strategies.lottery+direct"),
    },
  ];

  return (
    <div>
      <span>{t("admin.signupStrategy")}</span>{" "}
      <Dropdown
        options={strategies}
        selectedValue={signupStrategy as string}
        onChange={async (event: ChangeEvent<HTMLSelectElement>) => {
          setLoading(true);
          await dispatch(
            submitSetSignupStrategy(event.target.value as EventSignupStrategy),
          );
          setLoading(false);
        }}
        loading={loading}
      />
    </div>
  );
};
