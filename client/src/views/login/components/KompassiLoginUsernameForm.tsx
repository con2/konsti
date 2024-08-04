import { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  KompassiVerifyErrorMessage,
  submitVerifyKompassiLogin,
} from "client/views/login/loginThunks";
import { ErrorMessage } from "client/components/ErrorMessage";
import { UncontrolledInput } from "client/components/UncontrolledInput";
import {
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from "shared/constants/validation";

interface KompassiLoginUsernameFormFields {
  username: string;
}

export const KompassiLoginUsernameForm = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const username = useAppSelector((state) => state.login.username);

  const [serverError, setServerError] =
    useState<KompassiVerifyErrorMessage | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<KompassiLoginUsernameFormFields>();

  const { isSubmitting } = useFormState({
    control,
  });

  const onSubmit: SubmitHandler<KompassiLoginUsernameFormFields> = async (
    loginFormFields,
  ): Promise<void> => {
    const errorMessage = await dispatch(
      submitVerifyKompassiLogin(loginFormFields.username),
    );
    if (errorMessage) {
      setServerError(errorMessage);
      return;
    }

    // Navigate to previous page or front page if no previous page exists
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    window.history.state?.idx > 0 ? navigate(-1) : navigate("/");
  };

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      <InputContainer>
        <h2>{t("loginView.chooseKonstiUsername")}</h2>
        <StyledLabel htmlFor="username">{t("username")}</StyledLabel>
        <StyledInput
          id="username"
          {...register("username", {
            required: t(`validation.required`),
            minLength: {
              value: USERNAME_LENGTH_MIN,
              message: t(`validation.tooShort`, {
                length: USERNAME_LENGTH_MIN,
              }),
            },
            maxLength: {
              value: USERNAME_LENGTH_MAX,
              message: t(`validation.tooLong`, {
                length: USERNAME_LENGTH_MAX,
              }),
            },
            onChange: () => {
              setServerError(null);
            },
          })}
          defaultValue={username}
          type={"text"}
          data-testid={"login-form-input-username"}
        />
        <p>{t("registrationView.nickVisibleHintText")}</p>
      </InputContainer>
      {errors.username && (
        <FormFieldError>{errors.username.message}</FormFieldError>
      )}
      <FormRow>
        <Button
          type="submit"
          disabled={isSubmitting}
          buttonStyle={ButtonStyle.PRIMARY}
        >
          {t("button.save")}
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
