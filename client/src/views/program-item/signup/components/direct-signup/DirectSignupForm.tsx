import { isSameMinute } from "date-fns";
import { ReactElement, SyntheticEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { PostDirectSignupRequest } from "shared/types/api/myProgramItems";
import { ProgramItem } from "shared/types/models/programItem";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
import { Checkbox } from "client/components/Checkbox";
import { Dropdown } from "client/components/Dropdown";
import { ErrorMessage } from "client/components/ErrorMessage";
import { InfoText } from "client/components/InfoText";
import { TextArea } from "client/components/TextArea";
import { InfoTextVariant } from "client/components/componentStyles";
import { startLoading, stopLoading } from "client/state/loading/loadingSlice";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { getIsInGroup } from "client/views/group/groupUtils";
import { selectLotterySignups } from "client/views/my-program-items/myProgramItemsSlice";
import {
  PostDirectSignupErrorMessage,
  submitPostDirectSignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { getEntryCondition } from "client/views/program-item/programItemUtils";
import { SignupFormButtons } from "client/views/program-item/signup/components/SignupFormButtons";
import { isSignupConfirmDisabled } from "client/views/program-item/signup/components/signupFormUtils";

interface Props {
  programItem: ProgramItem;
  signupQuestion: SignupQuestion | undefined;
  onDirectSignupProgramItem: () => void;
  onCancelSignup: () => void;
}

export const DirectSignupForm = ({
  programItem,
  onDirectSignupProgramItem,
  onCancelSignup,
  signupQuestion,
}: Props): ReactElement => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const loading = useAppSelector((state) => state.loading);

  const [userSignupMessage, setUserSignupMessage] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<string>(
    (i18n.language === "fi"
      ? signupQuestion?.selectOptions[0]?.optionFi
      : signupQuestion?.selectOptions[0]?.optionEn) ?? "",
  );
  const [agreeEntryCondition, setAgreeEntryCondition] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] =
    useState<PostDirectSignupErrorMessage | null>(null);

  const entryCondition = getEntryCondition(programItem, t);

  const isInGroup = getIsInGroup(groupCode);

  // The lottery only gives spots to those who don't have one, so taking this spot cancels the
  // lottery sign-ups competing for the same slot. Other start times are untouched
  const lotterySignups = useAppSelector(selectLotterySignups);
  const programItemStartTime = getProgramItemStartTime(programItem);
  // Compared as instants, not strings: a configured parent start time and a program item's own
  // carry the same moment in different forms, and the server matches these with isSameMinute
  const lotterySignupsForSlot = lotterySignups.filter((lotterySignup) =>
    isSameMinute(
      new Date(getProgramItemStartTime(lotterySignup.programItem)),
      new Date(programItemStartTime),
    ),
  );

  const handleCancel = (): void => {
    onCancelSignup();
  };

  const handleSignup = async (event: SyntheticEvent): Promise<void> => {
    event.preventDefault();
    dispatch(startLoading());

    const enterData: PostDirectSignupRequest = {
      directSignupProgramItemId: programItem.programItemId,
      message: userSignupMessage || selectedValue,
    };

    const error = await dispatch(submitPostDirectSignup(enterData));
    if (error) {
      setErrorMessage(error);
    } else {
      onDirectSignupProgramItem();
    }

    dispatch(stopLoading());
  };

  return (
    <form>
      {lotterySignupsForSlot.length > 0 && (
        <InfoText variant={InfoTextVariant.WARNING}>
          {t("signup.lotterySignupsWillBeCancelled")}{" "}
          {/* Listed inline rather than as a <ul>: InfoText renders its children inside a
              <p>, which a list cannot legally sit in */}
          <CancelledLotterySignups>
            {lotterySignupsForSlot
              .map((lotterySignup) => lotterySignup.programItem.title)
              .join(", ")}
          </CancelledLotterySignups>
        </InfoText>
      )}

      {isLotterySignupProgramItem(programItem) && isInGroup && (
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

      {entryCondition && (
        <Checkbox
          checked={agreeEntryCondition}
          onChange={() => {
            setAgreeEntryCondition(!agreeEntryCondition);
          }}
          label={entryCondition.label}
          id={entryCondition.id}
        />
      )}

      <SignupFormButtons
        onConfirm={handleSignup}
        onCancel={handleCancel}
        confirmDisabled={isSignupConfirmDisabled(
          Boolean(entryCondition),
          agreeEntryCondition,
        )}
        loading={loading}
      />

      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}
    </form>
  );
};

const SignupQuestionContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledDropdown = styled(Dropdown)`
  max-width: 300px;
`;

const CancelledLotterySignups = styled.span`
  font-weight: 600;
`;
