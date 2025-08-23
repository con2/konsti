import { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useNavigate, useNavigationType } from "react-router";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  KompassiVerifyErrorMessage,
  submitFinalizeLogin,
  submitVerifyKompassiLogin,
  UpdateUserEmailAddressErrorMessage,
} from "client/views/login/loginThunks";
import { ErrorMessage } from "client/components/ErrorMessage";
import { UncontrolledInput } from "client/components/UncontrolledInput";
import {
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from "shared/constants/validation";
import { navigateToPreviousOrRoot } from "client/utils/navigation";
import { PrivacyPolicy } from "client/components/PrivacyPolicy";
import { Checkbox } from "client/components/Checkbox";
import { RadioButtonGroup } from "client/components/RadioButtonGroup";
import { RadioButton } from "client/components/RadioButton";

interface FinalizeRegistrationFormFields {
  username: string;
  registerDescription: boolean;
  email: string;
  emailDescription: boolean;
}

interface FinalizeRegistrationProps {
  kompassiUsernameAccepted: boolean;
  emailNotificationPermitAsked: boolean;
}

export const FinalizeRegistration = (
  props: FinalizeRegistrationProps,
): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const username = useAppSelector((state) => state.login.username);
  const email = useAppSelector((state) => state.login.email);

  const [serverError, setServerError] = useState<
    KompassiVerifyErrorMessage | UpdateUserEmailAddressErrorMessage | null
  >(null);

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState<boolean>(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FinalizeRegistrationFormFields>();

  const { isSubmitting } = useFormState({
    control,
  });

  const onSubmit: SubmitHandler<FinalizeRegistrationFormFields> = async (
    loginFormFields,
  ): Promise<void> => {
    const errorMessage = await dispatch(
      submitVerifyKompassiLogin(loginFormFields.username),
    );
    if (errorMessage) {
      setServerError(errorMessage);
      return;
    }

    const emailToSend = emailNotificationsEnabled ? loginFormFields.email : "";
    const emailErrorMessage = await dispatch(submitFinalizeLogin(emailToSend));
    if (emailErrorMessage) {
      setServerError(emailErrorMessage);
      return;
    }

    await navigateToPreviousOrRoot(navigationType, navigate);
  };

  const handleEmailNotificationChange = (enabled: boolean): void => {
    setEmailNotificationsEnabled(enabled);
  };

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      {props.kompassiUsernameAccepted ? null : (
        <>
          <InputContainer>
            <h2>{t("loginView.chooseKonstiUsername")}</h2>
            <StyledLabel htmlFor="username">{t("username")}</StyledLabel>
            <StyledInput
              id="username"
              {...register("username", {
                required: t("validation.required"),
                minLength: {
                  value: USERNAME_LENGTH_MIN,
                  message: t("validation.tooShort", {
                    length: USERNAME_LENGTH_MIN,
                  }),
                },
                maxLength: {
                  value: USERNAME_LENGTH_MAX,
                  message: t("validation.tooLong", {
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
        </>
      )}
      {props.emailNotificationPermitAsked ? null : (
        <InputContainer>
          <FormRow>
            <RadioButtonGroup>
              <RadioButton
                checked={emailNotificationsEnabled}
                id={"email-notifications-enabled"}
                label={t("email.notifications.accepted")}
                name={"emailNotifications"}
                onChange={() => handleEmailNotificationChange(true)}
              />
              <InputContainer>
                <StyledEmailInput
                  id="email"
                  {...register("email", {
                    required: emailNotificationsEnabled
                      ? t("validation.required")
                      : false,
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: t("validation.invalidEmail"),
                    },
                    onChange: () => {
                      setServerError(null);
                    },
                  })}
                  defaultValue={email}
                  type={"email"}
                  disabled={!emailNotificationsEnabled}
                />
              </InputContainer>
              {errors.email && (
                <FormFieldError>{errors.email.message}</FormFieldError>
              )}

              <RadioButton
                checked={!emailNotificationsEnabled}
                id={"email-notifications-disabled"}
                label={t("email.notifications.rejected")}
                name={"emailNotifications"}
                onChange={() => handleEmailNotificationChange(false)}
              />
            </RadioButtonGroup>
          </FormRow>
          <FormRow>
            <p>{t("email.notifications.registrationDescription")}</p>
          </FormRow>
        </InputContainer>
      )}
      <FormRow>
        <Checkbox
          {...register("registerDescription", {
            required: t("validation.required"),
            onChange: () => {
              setServerError(null);
            },
          })}
          id={"registerDescriptionCheckbox"}
          label={t("agreePrivacyPolicy")}
        />
      </FormRow>
      {errors.registerDescription && (
        <FormFieldError>{errors.registerDescription.message}</FormFieldError>
      )}
      <PrivacyPolicy />
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

const StyledEmailInput = styled(UncontrolledInput)`
  width: min(250px, 100%);
  ${(props) =>
    props.disabled &&
    `
      background-color: ${props.theme.backgroundDisabled || "#f5f5f5"};
      cursor: not-allowed;
      opacity: 0.6;
    `};
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
