import { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppDispatch } from "client/utils/hooks";
import { LoginErrorMessage, submitLogin } from "client/views/login/loginThunks";
import { ErrorMessage } from "client/components/ErrorMessage";
import { UncontrolledInput } from "client/components/UncontrolledInput";
import { navigateToPreviousOrRoot } from "client/utils/navigation";

export interface LoginFormFields {
  username: string;
  password: string;
}

export const LoginForm = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [serverError, setServerError] = useState<LoginErrorMessage | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<LoginFormFields>();

  const { isSubmitting } = useFormState({
    control,
  });

  const onSubmit: SubmitHandler<LoginFormFields> = async (
    loginFormFields,
  ): Promise<void> => {
    const errorMessage = await dispatch(submitLogin(loginFormFields));
    if (errorMessage) {
      setServerError(errorMessage);
      return;
    }

    await navigateToPreviousOrRoot(window.history, navigate);
  };

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      <InputContainer>
        <StyledLabel htmlFor="username">{t("username")}</StyledLabel>
        <StyledInput
          id="username"
          {...register("username", {
            required: t(`validation.required`),
            onChange: () => {
              setServerError(null);
            },
          })}
          type={"text"}
          data-testid={"login-form-input-username"}
        />
      </InputContainer>

      {errors.username && (
        <FormFieldError>{errors.username.message}</FormFieldError>
      )}

      <InputContainer>
        <StyledLabel htmlFor="password">{t("password")}</StyledLabel>
        <FormRow>
          <StyledInput
            id="password"
            {...register("password", {
              required: t(`validation.required`),
              onChange: () => {
                setServerError(null);
              },
            })}
            type={passwordVisible ? "text" : "password"}
            data-testid={"login-form-input-password"}
          />

          <FormFieldIcon>
            <FontAwesomeIcon
              icon={passwordVisible ? "eye-slash" : "eye"}
              onClick={() => setPasswordVisible(!passwordVisible)}
              aria-label={
                passwordVisible
                  ? t("iconAltText.hidePassword")
                  : t("iconAltText.showPassword")
              }
            />
          </FormFieldIcon>
        </FormRow>
      </InputContainer>

      {errors.password && (
        <FormFieldError>{errors.password.message}</FormFieldError>
      )}

      <FormRow>
        <Button
          type="submit"
          disabled={isSubmitting}
          buttonStyle={ButtonStyle.PRIMARY}
          data-testid="login-button"
        >
          {t("button.login")}
        </Button>
      </FormRow>

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
        />
      )}
    </StyledForm>
  );
};

const FormFieldError = styled.div`
  display: flex;
  background: ${(props) => props.theme.backgroundHighlight};
  color: ${(props) => props.theme.textError};
  width: 50%;
  padding: 0 10px;
  margin-top: -8px;
  font-size: ${(props) => props.theme.fontSizeSmall};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    width: 100%;
  }
`;

const StyledInput = styled(UncontrolledInput)`
  width: min(250px, 100%);
`;

const FormRow = styled.div`
  align-items: center;
  display: flex;
  flex: 0 1 auto;
  flex-direction: row;
  width: 50%;
  justify-content: flex-start;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    width: 100%;
  }
`;

const FormFieldIcon = styled.span`
  font-size: ${(props) => props.theme.fontSizeLarge};
`;

const StyledForm = styled.form`
  display: flex;
  gap: 16px;
  flex-direction: column;
`;

const StyledLabel = styled.label`
  padding: 0 0 2px 4px;
  font-size: ${(props) => props.theme.fontSizeSmall};
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
