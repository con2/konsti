import { ChangeEvent, FormEvent, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { capitalize } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import {
  PostLotterySignupErrorMessage,
  submitPostLotterySignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { Dropdown } from "client/components/Dropdown";
import { ButtonGroup } from "client/components/ButtonGroup";
import {
  DirectSignupWithProgramItem,
  selectLotterySignups,
} from "client/views/my-program-items/myProgramItemsSlice";
import { LotterySignup } from "shared/types/models/user";
import { InfoText, InfoTextVariant } from "client/components/InfoText";

interface Props {
  programItem: ProgramItem;
  startTime: string;
  closeSignupForm: () => void;
  directSignupForSlot?: DirectSignupWithProgramItem;
}

const OPTIONS = [1, 2, 3];

export const LotterySignupForm = ({
  programItem,
  startTime,
  closeSignupForm,
  directSignupForSlot,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  // We need all lottery signups here
  const lotterySignups = useAppSelector(selectLotterySignups);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);

  const selectedPriorities = new Set(
    lotterySignups
      .filter(
        (lotterySignup) => lotterySignup.programItem.startTime === startTime,
      )
      .map((lotterySignup) => lotterySignup.priority),
  );

  const firstUnselected = OPTIONS.filter(
    (option) => !selectedPriorities.has(option),
  );

  const firstOption = firstUnselected.length > 0 ? firstUnselected[0] : 1;

  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<number>(firstOption);

  const [errorMessage, setErrorMessage] =
    useState<PostLotterySignupErrorMessage | null>(null);

  const onChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setPriority(Number.parseInt(event.target.value, 10));
  };

  const handleCancel = (): void => {
    closeSignupForm();
  };

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    if (!priority) {
      return;
    }

    const newProgramItem: LotterySignup = {
      programItemId: programItem.programItemId,
      priority,
      signedToStartTime: programItem.startTime,
    };
    const error = await dispatch(submitPostLotterySignup(newProgramItem));

    if (error) {
      setErrorMessage(error);
    } else {
      setErrorMessage(null);
    }
    closeSignupForm();
    setLoading(false);
  };

  const options = OPTIONS.map((n) => {
    const nStr = n.toString(10);
    return {
      value: nStr,
      title: nStr,
      disabled: selectedPriorities.has(n),
    };
  });

  return (
    <form>
      {t("signup.programItemPriority", {
        PROGRAM_TYPE: capitalize(
          t(`programTypeSingular.${programItem.programType}`),
        ),
      })}{" "}
      <StyledDropdown
        onChange={onChange}
        options={options}
        selectedValue={priority.toString()}
      />
      {directSignupForSlot && (
        <InfoText variant={InfoTextVariant.WARNING}>
          {t("signup.alreadySignedToProgramItem", {
            PROGRAM_TYPE: t(
              `programTypeIllative.${directSignupForSlot.programItem.programType}`,
            ),
          })}{" "}
          <b>{directSignupForSlot.programItem.title}</b>
          {". "}
          {t("signup.signupWillBeRemoved", {
            PROGRAM_TYPE_THIS: t(
              `programTypeIllative.${programItem.programType}`,
            ),
            PROGRAM_TYPE_OTHER: t(
              `programTypeIllative.${directSignupForSlot.programItem.programType}`,
            ),
            OTHER_PROGRAM_NAME: directSignupForSlot.programItem.title,
          })}
        </InfoText>
      )}
      {isGroupCreator && <InfoText>{t("signup.groupSignupInfo")}</InfoText>}
      <StyledButtonGroup>
        <StyledButton
          onClick={handleSignup}
          buttonStyle={ButtonStyle.PRIMARY}
          disabled={loading}
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
    </form>
  );
};

const StyledDropdown = styled(Dropdown)`
  margin-right: 8px;
`;

const StyledButton = styled(Button)`
  min-width: 200px;
`;

const StyledButtonGroup = styled(ButtonGroup)`
  justify-content: center;
`;
