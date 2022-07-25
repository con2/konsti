import React, { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Accordion } from "client/components/Accordion";
import { sharedConfig } from "shared/config/sharedConfig";
import { ConventionType } from "shared/config/sharedConfig.types";
import { Button, ButtonStyle } from "client/components/Button";
import { RegistrationFormFields } from "shared/typings/api/login";
import { useAppDispatch } from "client/utils/hooks";
import {
  submitRegistration,
  RegistrationErrorMessage,
} from "client/views/registration/registrationThunks";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from "shared/constants/validation";
import { ErrorMessage } from "client/components/ErrorMessage";
import privacyPolicyFi from "client/markdown/PrivacyPolicyFi.md";
import privacyPolicyEn from "client/markdown/PrivacyPolicyEn.md";

export const RegistrationForm = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();

  const serialRequired = sharedConfig.conventionType === ConventionType.LIVE;

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [serverError, setServerError] =
    useState<RegistrationErrorMessage | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<RegistrationFormFields>();

  const { isSubmitting } = useFormState({
    control,
  });

  const onSubmit: SubmitHandler<RegistrationFormFields> = async (
    registrationFormFields
  ): Promise<void> => {
    const errorMessage = await dispatch(
      submitRegistration(registrationFormFields)
    );
    errorMessage && setServerError(errorMessage);
  };

  return (
    <div>
      <h2>{t("pageTitle.registration")}</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <StyledFormField>
            <StyledInput
              {...register("username", {
                required: `${t(`validation.required`)}`,
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
              placeholder={t("username")}
              type={"text"}
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
                minLength: {
                  value: PASSWORD_LENGTH_MIN,
                  message: t(`validation.tooShort`, {
                    length: PASSWORD_LENGTH_MIN,
                  }),
                },
                maxLength: {
                  value: PASSWORD_LENGTH_MAX,
                  message: t(`validation.tooLong`, {
                    length: PASSWORD_LENGTH_MAX,
                  }),
                },
                onChange: () => {
                  setServerError(null);
                },
              })}
              placeholder={t("password")}
              type={passwordVisible ? "text" : "password"}
            />
          </StyledFormField>

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

        {errors.password && (
          <FormFieldError>{errors.password.message}</FormFieldError>
        )}

        {serialRequired && (
          <>
            <FormRow>
              <StyledFormField>
                <StyledInput
                  {...register("serial", {
                    required: `${t(`validation.required`)}`,
                    onChange: () => {
                      setServerError(null);
                    },
                  })}
                  placeholder={t("serial")}
                  type={"text"}
                />
              </StyledFormField>
            </FormRow>

            {errors.serial && (
              <FormFieldError>{errors.serial.message}</FormFieldError>
            )}

            <SmallLabel htmlFor="serial">
              {t("registrationSerialHelp")}
            </SmallLabel>
          </>
        )}

        <FormRow>
          <StyledFormField>
            <StyledCheckbox
              {...register("registerDescription", {
                required: `${t(`validation.required`)}`,
                onChange: () => {
                  setServerError(null);
                },
              })}
              type={"checkbox"}
            />
            <label htmlFor="registerDescription">
              {t("agreePrivacyPolicy")}
            </label>
          </StyledFormField>
        </FormRow>

        {errors.registerDescription && (
          <FormFieldError>{errors.registerDescription.message}</FormFieldError>
        )}

        <Accordion toggleButton={t("privacyPolicyButton")}>
          <PrivacyPolicyContent>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {i18n.language === "fi" ? privacyPolicyFi : privacyPolicyEn}
            </ReactMarkdown>
          </PrivacyPolicyContent>
        </Accordion>

        <Button
          type="submit"
          buttonStyle={isSubmitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
        >
          {t("button.register")}
        </Button>

        {serverError && (
          <ErrorMessage
            message={t(serverError)}
            closeError={() => setServerError(null)}
          />
        )}
      </form>
    </div>
  );
};

const StyledInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
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

const FormFieldIcon = styled.span`
  padding: 0 0 0 8px;
  font-size: ${(props) => props.theme.fontSizeLarge};
`;

const StyledCheckbox = styled.input`
  margin-right: 10px;
  width: 16px;
`;

const SmallLabel = styled.label`
  font-size: 14px;
`;

const PrivacyPolicyContent = styled.div`
  padding: 0 10px;
`;
