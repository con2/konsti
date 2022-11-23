import React, { ReactElement } from "react";
import styled from "styled-components";

interface Props {
  tags: string[];
}

export const Tags = ({ tags }: Props): ReactElement => {
  return (
    <TagsContainer>
      {tags.map((tag) => (
        <TagElement key={tag}>{tag}</TagElement>
      ))}
    </TagsContainer>
  );
};

const TagsContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const TagElement = styled.span`
  display: flex;
  background-color: ${(props) => props.theme.backgroundTag};
  border-radius: 100px;
  align-items: center;
  text-align: center;
  padding: 5px 8px;
  margin-bottom: 4px;
  font-size: ${(props) => props.theme.fontSizeSmaller};
  color: ${(props) => props.theme.textTag};
  white-space: nowrap;
  text-overflow: ellipsis;
`;
