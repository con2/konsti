import styled from "styled-components";

export const MyProgramListItem = styled.li`
  align-items: center;
  justify-content: left;
  margin-bottom: 8px;
  list-style: none;
`;

export const MyProgramList = styled.ul`
  margin-left: 16px;

  li:first-child {
    margin-top: -12px;
  }
`;

export const MyProgramTime = styled.h2`
  margin: 20px 0 0 0;
  font-size: ${(props) => props.theme.fontSizeNormal};
`;

export const MyProgramGameTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizeNormal};
  font-weight: normal;
  margin-top: 24px;
  margin-bottom: 4px;
`;

export const MyProgramButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

export const MyProgramHeader = styled.h1`
  margin: 0 0 -8px 0;
  font-size: ${(props) => props.theme.fontSizeLarge};
`;

export const MyProgramSecondaryText = styled.p`
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 0;
`;
