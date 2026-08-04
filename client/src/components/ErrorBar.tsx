import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { removeError } from "client/views/admin/adminSlice";
import { BackendErrorType } from "client/types/errorTypes";

export const ErrorBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const errors = useAppSelector((state) => state.admin.errors);

  const errorList = errors.map((error) => {
    // Errors are stored as translation keys so removal matching survives
    // language switches; translate here at render time
    const message =
      error.errorKey === BackendErrorType.API_ERROR
        ? t(error.errorKey, {
            method: error.method,
            url: error.url,
            errorReason: t(error.errorReason),
          })
        : t(error.errorKey);
    return (
      <StyledError
        key={message}
        data-testid="error-bar-item"
        onClick={() => {
          dispatch(removeError(error));
        }}
      >
        <span>{message}</span>{" "}
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
  margin: 4px 0;
`;

const ErrorContainer = styled.div`
  cursor: pointer;
`;
