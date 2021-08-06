import React, { ReactElement } from "react";

interface Props {
  text: string;
}

export const Paragraph = ({ text }: Props): ReactElement => {
  const rows = text.split("\n");
  return (
    <>
      {rows.map((row) => (
        <p key={row}>{row}</p>
      ))}
    </>
  );
};
