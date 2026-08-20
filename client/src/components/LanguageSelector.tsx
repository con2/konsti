import { TFunction } from "i18next";
import { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Locale } from "shared/types/locale";
import { setLocale } from "shared/utils/setLocale";
import { Dropdown } from "client/components/Dropdown";

export const LanguageSelector = (): ReactElement => {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  // Language toggle
  const toggle = async (lng: string): Promise<TFunction> =>
    await i18n.changeLanguage(lng);

  const setLanguage = (event: ChangeEvent<HTMLSelectElement>): void => {
    // The dropdown only offers the two options below, so anything else falls
    // back to English rather than reaching the formatters as a language they
    // have no locale for
    const locale = z.enum(Locale).catch(Locale.EN).parse(event.target.value);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    toggle(locale);
    setLocale(locale);
  };

  const options = [
    { value: Locale.EN, title: t("language.englishShort") },
    { value: Locale.FI, title: t("language.finnishShort") },
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
