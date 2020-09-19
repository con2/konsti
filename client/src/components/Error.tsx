import React, { FC, ReactElement } from 'react';

interface Props {
  meta: { touched: boolean; error: string };
}

export const Error: FC<Props> = (props: Props): ReactElement => {
  const {
    meta: { touched, error },
  } = props;

  return touched && error ? <span>{error}</span> : <span />;
};
