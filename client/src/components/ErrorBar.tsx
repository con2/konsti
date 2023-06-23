import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { removeError } from "client/views/admin/adminSlice";
import { HEADER_HEIGHT } from "client/components/Header";

export enum BackendErrorType {
  NETWORK_ERROR = "backendError.networkError",
  API_ERROR = "backendError.apiError",
  UNAUTHORIZED = "backendError.unauthorized",
  INVALID_REQUEST = "backendError.invalidRequest",
  UNKNOWN = "backendError.unknown",
}

export const ErrorBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const errors = useAppSelector((state) => state.admin.errors);

  const errorList = errors.map((error) => {
    return (
      <StyledError
        key={error}
        onClick={() => {
          dispatch(removeError(error));
        }}
      >
        <span>{t(error)}</span>{" "}
        <span>
          {" "}
          <FontAwesomeIcon
            icon="xmark"
            aria-label={t("iconAltText.closeError")}
          />
        </span>
      </StyledError>
    );
  });

  return <ErrorContainer>{errorList}</ErrorContainer>;
};

const StyledError = styled.p`
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: ${(props) => props.theme.backgroundWarning};
  color: ${(props) => props.theme.textMain};
  border: 1px solid ${(props) => props.theme.borderWarning};
  border-radius: 4px;
  margin: 4px 2px;
`;

const ErrorContainer = styled.div`
  position: sticky;
  top: ${HEADER_HEIGHT}px;
  z-index: 10;
  cursor: pointer;
`;
