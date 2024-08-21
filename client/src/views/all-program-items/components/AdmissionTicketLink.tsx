import { ReactElement } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, ButtonStyle } from "client/components/Button";

interface Props {
  programItemId: string;
}
export const AdmissionTicketLink = ({ programItemId }: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <NavLink to={`/program/item/${programItemId}/admission`}>
      <StyledButton buttonStyle={ButtonStyle.PRIMARY}>
        {t("button.showAdmissionTicket")}
      </StyledButton>
    </NavLink>
  );
};

const StyledButton = styled(Button)`
  min-width: 400px;
  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 100%;
    min-width: 0;
  }
`;
