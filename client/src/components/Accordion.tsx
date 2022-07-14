import React, { ReactElement, ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";

interface Props {
  toggleButton: string | ReactElement;
  children?: ReactNode;
  initialValue?: boolean;
}

export const Accordion = ({
  toggleButton,
  children,
  initialValue = false,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [open, setOpen] = useState<boolean>(initialValue);

  const onClick = (): void => {
    setOpen(!open);
  };

  return (
    <div>
      <AccordionToggle
        onClick={() => onClick()}
        buttonStyle={ButtonStyle.NORMAL}
        aria-label={
          open
            ? t("iconAltText.closeAccordion")
            : t("iconAltText.openAccordion")
        }
      >
        <AccordionIcon
          icon={open ? "angle-up" : "angle-down"}
          aria-hidden="true"
        />

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
`;

const AccordionToggle = styled(Button)`
  padding: 6px 10px;
`;

const AccordionIcon = styled(FontAwesomeIcon)`
  margin: 0 10px 0 0;
  font-size: 18px;
`;
