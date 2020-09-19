import React, { FC, ReactElement, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import moment from 'moment';
import styled from 'styled-components';

export const LanguageSelector: FC = (): ReactElement => {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  // Language toggle
  const toggle = async (lng: string): Promise<TFunction> =>
    await i18n.changeLanguage(lng);

  const setLanguage = (event: ChangeEvent<HTMLSelectElement>): void => {
    toggle(event.target.value);
    moment.locale(event.target.value);
  };

  return (
    <>
      <LanguageSelectorContainer
        id='language'
        value={language}
        onChange={setLanguage}
      >
        <option title={t('language.english')} value='en'>
          {t('language.englishShort')}
        </option>
        <option title={t('language.finnish')} value='fi'>
          {t('language.finnishShort')}
        </option>
      </LanguageSelectorContainer>
    </>
  );
};

const LanguageSelectorContainer = styled.select`
  height: 30px;
  width: 60px;
`;
