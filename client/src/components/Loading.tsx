import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import loaderImage from 'assets/loading.gif';

export const Loading: FC = (): ReactElement => {
  const { t } = useTranslation();
  return (
    <LoadingContainer>
      <p>{t('loading')}</p>
      <img alt={t('loading')} src={loaderImage} width='40' />
    </LoadingContainer>
  );
};

const LoadingContainer = styled.div`
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  align-items: center;
  font-weight: 600;
`;
