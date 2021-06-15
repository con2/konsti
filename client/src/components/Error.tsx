import React, { ReactElement } from 'react';

interface Props {
  meta: { touched: boolean; error: string };
}

export const Error = ({ meta: { touched, error } }: Props): ReactElement => {
  return touched && error ? <span>{error}</span> : <span />;
};
