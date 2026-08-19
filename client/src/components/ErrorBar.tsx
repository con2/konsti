import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { DismissibleBanner } from "client/components/DismissibleBanner";
import { HighlightStyle } from "client/components/componentStyles";
import { BackendErrorType } from "client/types/errorTypes";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { removeError } from "client/views/admin/adminSlice";

export const ErrorBar = (): ReactElement | null => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const errors = useAppSelector((state) => state.admin.errors);

  if (errors.length === 0) {
    return null;
  }

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
      <DismissibleBanner
        key={message}
        data-testid="error-bar-item"
        icon="triangle-exclamation"
        highlightStyle={HighlightStyle.WARN}
        dismissAriaLabel={t("iconAltText.closeError")}
        onDismiss={() => {
          dispatch(removeError(error));
        }}
      >
        <span>{message}</span>
      </DismissibleBanner>
    );
  });

  return <div>{errorList}</div>;
};
