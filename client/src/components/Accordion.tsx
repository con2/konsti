import React, { ReactElement, ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import { Button } from "client/components/Button";

export interface Props {
  toggleButton: string | ReactElement;
  children?: ReactNode;
  initialValue?: boolean;
}

export const Accordion = ({
  toggleButton,
  children,
  initialValue = false,
}: Props): ReactElement => {
  const [open, setOpen] = useState<boolean>(initialValue);

  const onClick = (): void => {
    setOpen(!open);
  };

  return (
    <div>
      <AccordionToggle onClick={() => onClick()}>
        {<AccordionIcon icon={open ? "angle-up" : "angle-down"} />}
        {toggleButton}
      </AccordionToggle>

      {open && (
        <AccordionContent>
          <div>{children}</div>
        </AccordionContent>
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

const AccordionToggle = styled(Button)`
  padding: 6px 10px;
`;

const AccordionIcon = styled(FontAwesomeIcon)`
  margin: 0 10px 0 0;
  font-size: 18px;
`;
