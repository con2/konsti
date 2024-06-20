import { ReactElement } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  isExpanded: boolean;
  showMoreText: string;
  showLessText: string;
  showMoreAriaLabel: string;
  showLessAriaLabel: string;
  ariaControls: string;
  onClick: () => void;
}
export const ExpandButton = ({
  isExpanded,
  showMoreText,
  showLessText,
  showMoreAriaLabel,
  showLessAriaLabel,
  ariaControls,
  onClick,
}: Props): ReactElement => {
  return (
    <ButtonContainer
      role="button"
      onClick={onClick}
      aria-controls={ariaControls}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? showLessAriaLabel : showMoreAriaLabel}
    >
      <ArrowIcon
        aria-hidden="true"
        icon={isExpanded ? "angle-up" : "angle-down"}
      />
      <ButtonText>{isExpanded ? showLessText : showMoreText}</ButtonText>
    </ButtonContainer>
  );
};

const ArrowIcon = styled(FontAwesomeIcon)`
  margin: 0 8px 4px 0;
  font-size: 16px;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const ButtonText = styled.span`
  text-decoration: underline;
`;
