import { ReactElement, useState } from "react";
import { SubmitHandler, useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Accordion } from "client/components/Accordion";
import { config } from "shared/config";
import { Button, ButtonStyle } from "client/components/Button";
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
import PrivacyPolicy from "client/markdown/PrivacyPolicy.mdx";
import { UncontrolledInput } from "client/components/UncontrolledInput";

export interface RegistrationFormFields {
  password: string;
  username: string;
  registerDescription: boolean;
  serial?: string;
}

export const RegistrationForm = (): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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
    registrationFormFields,
  ): Promise<void> => {
    const errorMessage = await dispatch(
      submitRegistration(registrationFormFields),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    errorMessage && setServerError(errorMessage);
  };

  return (
    <div>
      <StyledForm onSubmit={handleSubmit(onSubmit)}>
        <>
          <InputContainer>
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
              type={"text"}
            />
          </InputContainer>
          <SmallLabel htmlFor="username">
            {t("registrationView.nickVisibleHintText")}
          </SmallLabel>
        </>

        {errors.username && (
          <FormFieldError>{errors.username.message}</FormFieldError>
        )}

        <InputContainer>
          <StyledLabel htmlFor="password">{t("password")}</StyledLabel>
          <FormRow>
            <StyledInput
              {...register("password", {
                required: t(`validation.required`),
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
              type={passwordVisible ? "text" : "password"}
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

        {config.shared().requireRegistrationCode && (
          <>
            <InputContainer>
              <StyledLabel htmlFor="serial">{t("serial")}</StyledLabel>
              <StyledInput
                id="serial"
                {...register("serial", {
                  required: t(`validation.required`),
                  onChange: () => {
                    setServerError(null);
                  },
                })}
                type={"text"}
              />
            </InputContainer>

            {errors.serial && (
              <FormFieldError>{errors.serial.message}</FormFieldError>
            )}

            <SmallLabel htmlFor="serial">
              {t("registrationSerialHelp")}
            </SmallLabel>
          </>
        )}

        <FormRow>
          <label htmlFor="registerDescriptionCheckbox">
            <StyledCheckbox
              {...register("registerDescription", {
                required: t(`validation.required`),
                onChange: () => {
                  setServerError(null);
                },
              })}
              type={"checkbox"}
              id={"registerDescriptionCheckbox"}
            />
            {t("agreePrivacyPolicy")}
          </label>
        </FormRow>

        {errors.registerDescription && (
          <FormFieldError>{errors.registerDescription.message}</FormFieldError>
        )}

        <Accordion
          closeAccordionText={t("hidePrivacyPolicy")}
          openAccordionText={t("showPrivacyPolicy")}
        >
          <PrivacyPolicyContent>
            <PrivacyPolicy />
          </PrivacyPolicyContent>
        </Accordion>

        <FormRow>
          <Button
            disabled={isSubmitting}
            type="submit"
            buttonStyle={ButtonStyle.PRIMARY}
          >
            {t("button.register")}
          </Button>
        </FormRow>

        {serverError && (
          <ErrorMessage
            message={t(serverError)}
            closeError={() => setServerError(null)}
          />
        )}
      </StyledForm>
    </div>
  );
};

const widthDefinition = css`
  width: 50%;
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
  justify-content: flex-start;

  ${widthDefinition}
`;

const FormFieldError = styled.div`
  display: flex;
  background: ${(props) => props.theme.backgroundHighlight};
  color: ${(props) => props.theme.textError};
  padding: 0 0 4px 10px;
  font-size: ${(props) => props.theme.fontSizeSmaller};
  margin-top: -8px;
  ${widthDefinition}
`;

const FormFieldIcon = styled.span`
  padding: 0 0 0 8px;
  font-size: ${(props) => props.theme.fontSizeLarge};
`;

const StyledCheckbox = styled.input`
  margin-right: 8px;
  transform: scale(1.4);
  width: 16px;
  accent-color: ${(props) => props.theme.formAccent};
`;

const SmallLabel = styled.label`
  font-size: ${(props) => props.theme.fontSizeSmaller};
`;

const PrivacyPolicyContent = styled.div`
  padding: 0 10px;
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
