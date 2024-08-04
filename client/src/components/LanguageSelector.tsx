import { ReactElement, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { setLocale } from "shared/utils/setLocale";
import { Dropdown } from "client/components/Dropdown";

export const LanguageSelector = (): ReactElement => {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  // Language toggle
  const toggle = async (lng: string): Promise<TFunction> =>
    await i18n.changeLanguage(lng);

  const setLanguage = (event: ChangeEvent<HTMLSelectElement>): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    toggle(event.target.value);
    setLocale(event.target.value);
  };

  const options = [
    { value: "en", title: t("language.englishShort") },
    { value: "fi", title: t("language.finnishShort") },
  ];

  return (
    <Dropdown
      id="language"
      selectedValue={language}
      onChange={setLanguage}
      options={options}
    />
  );
};
