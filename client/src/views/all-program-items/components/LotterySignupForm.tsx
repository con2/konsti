import { ReactElement, FormEvent, useState, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { upperFirst } from "lodash-es";
import { ProgramItem } from "shared/types/models/programItem";
import {
  PostLotterySignupsErrorMessage,
  submitPostLotterySignups,
} from "client/views/my-program-items/myProgramItemsThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { Dropdown } from "client/components/Dropdown";
import { ButtonGroup } from "client/components/ButtonGroup";
import { selectLotterySignups } from "client/views/my-program-items/myProgramItemsSlice";
import { Signup } from "shared/types/models/user";
import { InfoText } from "client/components/InfoText";

interface Props {
  programItem: ProgramItem;
  startTime: string;
  onCancel: () => void;
}

const OPTIONS = [1, 2, 3];

export const LotterySignupForm = ({
  programItem,
  startTime,
  onCancel,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  // We need all lottery signups here
  const lotterySignups = useAppSelector(selectLotterySignups);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);

  const selectedPriorities = lotterySignups
    .filter(
      (lotterySignup) => lotterySignup.programItem.startTime === startTime,
    )
    .map((lotterySignup) => lotterySignup.priority);

  const firstUnselected = OPTIONS.filter(
    (option) => !selectedPriorities.includes(option),
  );

  const firstOption = firstUnselected.length > 0 ? firstUnselected[0] : 1;

  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<number>(firstOption);

  const [errorMessage, setErrorMessage] =
    useState<PostLotterySignupsErrorMessage | null>(null);

  const onChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setPriority(parseInt(event.target.value, 10));
  };

  const handleCancel = (): void => {
    onCancel();
  };

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    if (!priority) {
      return;
    }

    const newProgramItem: Signup[] = [
      {
        programItem,
        priority,
        time: programItem.startTime,
        message: "",
      },
    ];

    const error = await dispatch(
      submitPostLotterySignups({
        lotterySignups: lotterySignups.concat(newProgramItem),
        startTime: programItem.startTime,
      }),
    );

    if (error) {
      setErrorMessage(error);
    } else {
      setErrorMessage(null);
    }
    setLoading(false);
  };

  const options = OPTIONS.map((n) => {
    const nStr = n.toString(10);
    return {
      value: nStr,
      title: nStr,
      disabled: selectedPriorities.includes(n),
    };
  });

  return (
    <form>
      {t("signup.programItemPriority", {
        PROGRAM_TYPE: upperFirst(
          t(`programTypeSingular.${programItem.programType}`),
        ),
      })}{" "}
      <StyledDropdown
        onChange={onChange}
        options={options}
        selectedValue={priority.toString()}
      />
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
