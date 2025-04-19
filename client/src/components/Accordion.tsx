import { ReactElement, ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";

interface Props {
  buttonStyle?: ButtonStyle;
  openAccordionText: string;
  closeAccordionText: string;
  children?: ReactNode;
  initialValue?: boolean;
  className?: string;
}

export const Accordion = ({
  closeAccordionText,
  openAccordionText,
  buttonStyle = ButtonStyle.SECONDARY,
  children,
  initialValue = false,
  className,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const [open, setOpen] = useState<boolean>(initialValue);

  const onClick = (): void => {
    setOpen(!open);
  };

  return (
    <div className={className}>
      <AccordionToggle
        onClick={() => onClick()}
        buttonStyle={buttonStyle}
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

        {open ? closeAccordionText : openAccordionText}
      </AccordionToggle>

      {open && <div>{children}</div>}
    </div>
  );
};

const AccordionToggle = styled(Button)`
  padding: 6px 10px;
`;

const AccordionIcon = styled(FontAwesomeIcon)`
  margin: 0 10px 0 0;
  font-size: 18px;
`;
