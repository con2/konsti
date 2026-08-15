import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import styled from "styled-components";
import { AppRoute } from "client/app/AppRoutes";
import { ButtonStyle } from "client/components/Button";
import { ProgramItemButton } from "client/views/program-item/components/ProgramItemButton";

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
