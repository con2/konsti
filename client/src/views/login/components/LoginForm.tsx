import React, { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "client/components/Button";
import { LoginFormFields } from "shared/typings/api/login";
import { useAppDispatch } from "client/utils/hooks";
import { submitLogin } from "client/views/login/loginThunks";

export const LoginForm = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    clearErrors,
  } = useForm<LoginFormFields>();

  const { isSubmitting } = useFormState({
    control,
  });

  const onSubmit: SubmitHandler<LoginFormFields> = async (
    loginFormFields
  ): Promise<void> => {
    try {
      await dispatch(submitLogin(loginFormFields));
    } catch (error) {
      setServerError(t(error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormRow>
        <StyledFormField>
          <StyledInput
            {...register("username", {
              required: `${t(`validation.required`)}`,
            })}
            placeholder={t("username")}
            type={"text"}
            onChange={(e) => {
              clearErrors("username");
              setServerError("");
            }}
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
            })}
            placeholder={t("password")}
            type={passwordVisible ? "text" : "password"}
            onChange={(e) => {
              clearErrors("password");
              setServerError("");
            }}
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

      <Button type="submit" disabled={isSubmitting} data-testid="login-button">
        {t("button.login")}
      </Button>

      {serverError && <ErrorMessage>{serverError}</ErrorMessage>}
    </form>
  );
};

const ErrorMessage = styled.p`
  font-weight: 600;
  color: ${(props) => props.theme.error};
`;

const FormFieldError = styled.div`
  display: flex;
  background: ${(props) => props.theme.backgroundHighlight};
  color: ${(props) => props.theme.error};
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
  font-size: ${(props) => props.theme.iconSize};
`;
