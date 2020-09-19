import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

export interface Props {
  text: string;
  title: string;
  buttonText: string;
}

export const Accordion: FC<Props> = (props: Props): ReactElement => {
  const { text, title, buttonText } = props;

  const [open, setOpen] = React.useState<boolean>(false);

  const { t } = useTranslation();

  const onClick = (): void => {
    setOpen(!open);
  };

  const splitTextRows = (text: string): ReactElement[] => {
    const rows = t(text).split('\n');
    return rows.map((row) => <p key={row}>{row}</p>);
  };

  return (
    <div className='accordion'>
      {open && (
        <>
          <AccordionToggle onClick={() => onClick()}>
            <AccordionIcon icon='angle-up' />
            {t(`${buttonText}`)}
          </AccordionToggle>
          <AccordionContent>
            <h3>{t(`${title}`)}</h3>
            <div>{splitTextRows(text)}</div>
          </AccordionContent>
        </>
      )}
      {!open && (
        <>
          <AccordionToggle onClick={() => onClick()}>
            <AccordionIcon icon='angle-down' />
            <span>{t(`${buttonText}`)}</span>
          </AccordionToggle>
        </>
      )}
    </div>
  );
};

const AccordionContent = styled.div`
  box-shadow: 0 1px 0 rgba(9, 30, 66, 0.25);
  border: 1px solid ${(props) => props.theme.borderInactive};
  border-radius: 3px;
  padding: 0 10px;
`;

const AccordionToggle = styled.button`
  padding: 6px 10px;
`;

const AccordionIcon = styled(FontAwesomeIcon)`
  margin: 0 10px 0 0;
  font-size: 18px;
`;
