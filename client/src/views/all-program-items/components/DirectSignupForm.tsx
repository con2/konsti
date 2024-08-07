import { FormEvent, ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ProgramItem } from "shared/types/models/programItem";
import {
  PostDirectSignupErrorMessage,
  submitPostDirectSignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";
import { loadProgramItems } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";
import { getIsInGroup } from "client/views/group/groupUtils";
import {
  PostCloseGroupErrorMessage,
  PostLeaveGroupErrorMessage,
  submitCloseGroup,
  submitLeaveGroup,
} from "client/views/group/groupThunks";
import { config } from "shared/config";
import { TextArea } from "client/components/TextArea";
import { ButtonGroup } from "client/components/ButtonGroup";
import { Dropdown } from "client/components/Dropdown";
import { Checkbox } from "client/components/Checkbox";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { InfoText, InfoTextVariant } from "client/components/InfoText";

interface Props {
  programItem: ProgramItem;
  signupQuestion: SignupQuestion | undefined;
  onDirectSignupProgramItem: () => void;
  onCancelSignup: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const DirectSignupForm = ({
  programItem,
  onDirectSignupProgramItem,
  onCancelSignup,
  signupQuestion,
  loading,
  setLoading,
}: Props): ReactElement => {
  const { directSignupAlwaysOpenIds } = config.shared();

  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const username = useAppSelector((state) => state.login.username);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);

  const [userSignupMessage, setUserSignupMessage] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<string>(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (i18n.language === "fi"
      ? (signupQuestion?.selectOptions[0]?.optionFi ?? "")
      : (signupQuestion?.selectOptions[0]?.optionEn ?? "")) ?? "",
  );
  const [agreeEntryFee, setAgreeEntryFee] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<
    | PostDirectSignupErrorMessage
    | PostLeaveGroupErrorMessage
    | PostCloseGroupErrorMessage
    | null
  >(null);

  const isInGroup = getIsInGroup(groupCode);

  const handleCancel = (): void => {
    onCancelSignup();
  };

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);

    const enterData = {
      username,
      directSignupProgramItemId: programItem.programItemId,
      startTime: programItem.startTime,
      message: userSignupMessage || selectedValue,
      priority: DIRECT_SIGNUP_PRIORITY,
    };

    // TODO: This logic should be on backend
    if (
      config
        .shared()
        .twoPhaseSignupProgramTypes.includes(programItem.programType) &&
      !directSignupAlwaysOpenIds.includes(programItem.programItemId)
    ) {
      if (isInGroup && !isGroupCreator) {
        const leaveGroupError = await dispatch(submitLeaveGroup());

        if (leaveGroupError) {
          setErrorMessage(leaveGroupError);
          return;
        }
      } else if (isInGroup && isGroupCreator) {
        const closeGroupRequest = {
          username,
          groupCode,
        };

        const closeGroupError = await dispatch(
          submitCloseGroup(closeGroupRequest),
        );

        if (closeGroupError) {
          setErrorMessage(closeGroupError);
          return;
        }
      }
    }

    const error = await dispatch(submitPostDirectSignup(enterData));
    if (error) {
      setErrorMessage(error);
      setLoading(false);
      return;
    }

    await loadProgramItems();
    onDirectSignupProgramItem();
    setLoading(false);
  };

  return (
    <SignupForm>
      {config
        .shared()
        .twoPhaseSignupProgramTypes.includes(programItem.programType) &&
        !directSignupAlwaysOpenIds.includes(programItem.programItemId) &&
        isInGroup && (
          <>
            {!isGroupCreator && (
              <InfoText variant={InfoTextVariant.WARNING}>
                {t("signup.inGroupWarning", {
                  PROGRAM_TYPE: t(
                    `programTypeIllative.${programItem.programType}`,
                  ),
                })}
              </InfoText>
            )}
            {isGroupCreator && (
              <InfoText variant={InfoTextVariant.WARNING}>
                {t("signup.groupCreatorWarning", {
                  PROGRAM_TYPE: t(
                    `programTypeIllative.${programItem.programType}`,
                  ),
                })}
              </InfoText>
            )}
          </>
        )}

      {signupQuestion && (
        <SignupQuestionContainer>
          {signupQuestion.type === SignupQuestionType.TEXT && (
            <>
              <span>
                {i18n.language === "fi"
                  ? signupQuestion.questionFi
                  : signupQuestion.questionEn}{" "}
                {signupQuestion.private &&
                  `(${t("privateOnlyVisibleToOrganizers")})`}
              </span>
              <TextArea
                onChange={(event) => {
                  if (event.target.value.length > 140) {
                    return;
                  }
                  setUserSignupMessage(event.target.value);
                }}
                value={userSignupMessage}
              />
              <span>{userSignupMessage.length} / 140</span>
            </>
          )}

          {signupQuestion.type === SignupQuestionType.SELECT && (
            <>
              <span>
                {i18n.language === "fi"
                  ? signupQuestion.questionFi
                  : signupQuestion.questionEn}{" "}
                {signupQuestion.private &&
                  `(${t("privateOnlyVisibleToOrganizers")})`}
              </span>
              <StyledDropdown
                onChange={(event) => setSelectedValue(event.target.value)}
                options={signupQuestion.selectOptions.map((option) =>
                  i18n.language === "fi"
                    ? {
                        value: option.optionFi,
                        title: option.optionFi,
                      }
                    : {
                        value: option.optionEn,
                        title: option.optionEn,
                      },
                )}
                selectedValue={selectedValue}
              />
            </>
          )}
        </SignupQuestionContainer>
      )}

      {!!programItem.entryFee && (
        <Checkbox
          checked={agreeEntryFee}
          onChange={() => {
            setAgreeEntryFee(!agreeEntryFee);
          }}
          label={t("signup.entryFeeInfo", {
            ENTRY_FEE: programItem.entryFee,
          })}
          id={"entry-fee-agree-checkbox"}
        />
      )}

      <StyledButtonGroup>
        <StyledButton
          onClick={handleSignup}
          buttonStyle={ButtonStyle.PRIMARY}
          disabled={(!!programItem.entryFee && !agreeEntryFee) || loading}
        >
          {t("signup.confirm")}
        </StyledButton>
        <StyledButton
          onClick={handleCancel}
          buttonStyle={ButtonStyle.SECONDARY}
          disabled={loading}
        >
          {t("signup.cancel")}
        </StyledButton>
      </StyledButtonGroup>

      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}
    </SignupForm>
  );
};

const SignupForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const SignupQuestionContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledDropdown = styled(Dropdown)`
  max-width: 300px;
`;

const StyledButton = styled(Button)`
  min-width: 200px;
`;

const StyledButtonGroup = styled(ButtonGroup)`
  justify-content: center;
`;
