import { ReactElement } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ButtonStyle } from "client/components/Button";
import { ProgramItemButton } from "client/views/program-item/components/ProgramItemButton";
import { AppRoute } from "client/app/AppRoutes";

interface Props {
  programItemId: string;
}
export const AdmissionTicketLink = ({ programItemId }: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <StyledLink to={`${AppRoute.PROGRAM_ITEM}/${programItemId}/admission`}>
      <ProgramItemButton buttonStyle={ButtonStyle.PRIMARY}>
        {t("button.showAdmissionTicket")}
      </ProgramItemButton>
    </StyledLink>
  );
};

const StyledLink = styled(NavLink)`
  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    width: 100%;
    min-width: 0;
  }
`;
