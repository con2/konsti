import { ChangeEvent, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { Dropdown } from "client/components/Dropdown";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSetLoginProvider } from "client/views/admin/adminThunks";

export const LoginProviderSelector = (): ReactElement => {
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const strategies = Object.values(LoginProvider).map((value) => ({
    value,
    title: t(`loginProvider.${value}`),
  }));

  return (
    <div>
      <span>{t("admin.loginProvider")}</span>{" "}
      <Dropdown
        options={strategies}
        selectedValue={loginProvider as string}
        onChange={async (event: ChangeEvent<HTMLSelectElement>) => {
          setLoading(true);
          await dispatch(
            submitSetLoginProvider(event.target.value as LoginProvider),
          );
          setLoading(false);
        }}
        loading={loading}
      />
    </div>
  );
};
