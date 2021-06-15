import React, { ReactElement } from 'react';

interface Props {
  meta: { touched: boolean; error: string };
}

export const Error = (props: Props): ReactElement => {
  const {
    meta: { touched, error },
  } = props;

  return touched && error ? <span>{error}</span> : <span />;
};
