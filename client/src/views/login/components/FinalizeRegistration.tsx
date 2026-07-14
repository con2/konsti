import { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useNavigate, useNavigationType } from "react-router";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  KompassiVerifyErrorMessage,
  submitUpdateUserEmailAddress,
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
import { PrivacyNotice } from "client/components/PrivacyNotice";
import { Checkbox } from "client/components/Checkbox";
import {
  EMAIL_REGEX,
  EmailNotificationField,
  StyledEmailInput,
} from "client/components/EmailNotificationField";

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
  const kompassiId = useAppSelector((state) => state.login.kompassiId);

  // Local accounts already chose their username and agreed to the privacy
  // policy on the create-account page, so only Kompassi accounts confirm
  // them here
  const isKompassiAccount = kompassiId !== 0;

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
    if (isKompassiAccount) {
      const errorMessage = await dispatch(
        submitVerifyKompassiLogin(loginFormFields.username),
      );
      if (errorMessage) {
        setServerError(errorMessage);
        return;
      }
    }

    const emailToSend = emailNotificationsEnabled ? loginFormFields.email : "";
    const emailErrorMessage = await dispatch(
      submitUpdateUserEmailAddress(emailToSend),
    );
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
    // noValidate: the email input is type="email", and without it the
    // browser's native validation would block the submit before
    // react-hook-form runs, so the localized pattern message never showed
    <StyledForm onSubmit={handleSubmit(onSubmit)} noValidate>
      {props.kompassiUsernameAccepted || !isKompassiAccount ? null : (
        <>
          <InputContainer>
            <h2>{t("loginView.chooseKonstiUsername")}</h2>
            <StyledLabel htmlFor="username">{t("username")}</StyledLabel>
            <InfomationLabel htmlFor="username">
              {t("registrationView.nickVisibleHintText")}
            </InfomationLabel>
            <StyledInput
              id="username"
              {...register("username", {
                required: t("validation.required"),
                minLength: {
                  value: USERNAME_LENGTH_MIN,
                  message: t("validation.tooShort", {
                    length: String(USERNAME_LENGTH_MIN),
                  }),
                },
                maxLength: {
                  value: USERNAME_LENGTH_MAX,
                  message: t("validation.tooLong", {
                    length: String(USERNAME_LENGTH_MAX),
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
          </InputContainer>
          {errors.username && (
            <FormFieldError>{errors.username.message}</FormFieldError>
          )}
        </>
      )}
      {props.emailNotificationPermitAsked ? null : (
        <InputContainer>
          {!isKompassiAccount && (
            <h2>{t("loginView.emailNotificationsTitle")}</h2>
          )}
          <FormRow>
            <EmailNotificationField
              enabled={emailNotificationsEnabled}
              onEnabledChange={handleEmailNotificationChange}
            >
              <StyledEmailInput
                id="email"
                {...register("email", {
                  required: emailNotificationsEnabled
                    ? t("validation.required")
                    : false,
                  pattern: {
                    value: EMAIL_REGEX,
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
              {errors.email && (
                <EmailFieldError>{errors.email.message}</EmailFieldError>
              )}
            </EmailNotificationField>
          </FormRow>
          <FormRow>
            <Info>{t("email.notifications.registrationDescription")}</Info>
          </FormRow>
        </InputContainer>
      )}
      {isKompassiAccount && (
        <>
          <FormRow>
            <Checkbox
              {...register("registerDescription", {
                required: t("validation.required"),
                onChange: () => {
                  setServerError(null);
                },
              })}
              id={"registerDescriptionCheckbox"}
              label={t("agreePrivacyNotice")}
            />
          </FormRow>
          {errors.registerDescription && (
            <FormFieldError>
              {errors.registerDescription.message}
            </FormFieldError>
          )}
          <PrivacyNotice />
        </>
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

// FormFieldError's negative margin compensates the form's 16px gap, but the
// email error renders inside a gapless flex column right below the input, so
// the negative margin would pull it over the input
const EmailFieldError = styled(FormFieldError)`
  margin-top: 4px;
  width: min(250px, 100%);
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
`;

const InfomationLabel = styled(StyledLabel)`
  color: ${(props) => props.theme.textSecondary};
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Info = styled.p`
  color: ${(props) => props.theme.textSecondary};
`;
