import React, { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ButtonStyle } from "client/components/Button";
import { LoginFormFields } from "shared/typings/api/login";
import { useAppDispatch } from "client/utils/hooks";
import { LoginErrorMessage, submitLogin } from "client/views/login/loginThunks";
import { ErrorMessage } from "client/components/ErrorMessage";

export const LoginForm = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [serverError, setServerError] = useState<LoginErrorMessage>(
    LoginErrorMessage.EMPTY
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
    loginFormFields
  ): Promise<void> => {
    const errorMessage = await dispatch(submitLogin(loginFormFields));
    errorMessage && setServerError(errorMessage);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormRow>
        <StyledFormField>
          <StyledInput
            {...register("username", {
              required: `${t(`validation.required`)}`,
              onChange: (e) => {
                setServerError(LoginErrorMessage.EMPTY);
              },
            })}
            placeholder={t("username")}
            type={"text"}
            data-testid={"login-form-input-username"}
          />
        </StyledFormField>
      </FormRow>

      {errors.username && (
        <FormFieldError>{errors.username.message}</FormFieldError>
      )}

      <FormRow>
        <StyledFormField>
          <StyledInput
            {...register("password", {
              required: `${t(`validation.required`)}`,
              onChange: (e) => {
                setServerError(LoginErrorMessage.EMPTY);
              },
            })}
            placeholder={t("password")}
            type={passwordVisible ? "text" : "password"}
            data-testid={"login-form-input-password"}
          />
        </StyledFormField>

        <FormFieldIcon>
          <FontAwesomeIcon
            icon={passwordVisible ? "eye-slash" : "eye"}
            onClick={() => setPasswordVisible(!passwordVisible)}
          />
        </FormFieldIcon>
      </FormRow>

      {errors.password && (
        <FormFieldError>{errors.password.message}</FormFieldError>
      )}

      <Button
        type="submit"
        buttonStyle={isSubmitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
        data-testid="login-button"
      >
        {t("button.login")}
      </Button>

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(LoginErrorMessage.EMPTY)}
        />
      )}
    </form>
  );
};

const FormFieldError = styled.div`
  display: flex;
  background: ${(props) => props.theme.backgroundHighlight};
  color: ${(props) => props.theme.textError};
  width: 50%;
  padding: 4px 0 4px 10px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    width: 100%;
  }
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

const StyledFormField = styled.div`
  align-items: center;
  display: flex;
  flex: 0 1 auto;
  flex-direction: row;
  padding: 8px 0;
  width: 80%;
`;

const StyledInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
`;

const FormFieldIcon = styled.span`
  padding: 0 0 0 8px;
  font-size: ${(props) => props.theme.fontSizeLarge};
`;
