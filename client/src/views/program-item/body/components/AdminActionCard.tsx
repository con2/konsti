import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  ProgramItem,
  ProgramItemSignupStrategy,
} from "shared/types/models/programItem";
import {
  SignupQuestionSelectOption,
  SignupQuestionType,
} from "shared/types/models/settings";
import loaderImage from "assets/loading.gif";
import { Button } from "client/components/Button";
import { ButtonGroup } from "client/components/ButtonGroup";
import { Checkbox } from "client/components/Checkbox";
import { ControlledInput } from "client/components/ControlledInput";
import { Dropdown } from "client/components/Dropdown";
import { UncontrolledInput } from "client/components/UncontrolledInput";
import { ButtonStyle } from "client/components/componentStyles";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { selectHiddenProgramItems } from "client/views/admin/adminSlice";
import {
  submitAddSignupQuestion,
  submitDeleteSignupQuestion,
  submitUpdateHidden,
} from "client/views/admin/adminThunks";

interface Props {
  programItem: ProgramItem;
}

export const AdminActionCard = ({ programItem }: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const hiddenProgramItems = useAppSelector(selectHiddenProgramItems);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);
  const [hasSignupQuestion, setHasSignupQuestion] = useState<boolean>(false);
  const [isPrivateSignupQuestion, setIsPrivateSignupQuestion] =
    useState<boolean>(false);
  const [signupQuestionInputFi, setSignupQuestionInputFi] =
    useState<string>("");
  const [signupQuestionInputEn, setSignupQuestionInputEn] =
    useState<string>("");
  const [signupQuestionInputVisible, setSignupQuestionInputVisible] =
    useState<boolean>(false);
  const [questionType, setQuestionType] = useState(SignupQuestionType.TEXT);
  const [selectOptions, setSelectOptions] = useState<
    SignupQuestionSelectOption[]
  >([]);

  useEffect(() => {
    // Check if hidden
    if (
      hiddenProgramItems.some(
        (hiddenProgramItem) =>
          hiddenProgramItem.programItemId === programItem.programItemId,
      )
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(true);
    }

    // Check if sign-up question exists
    if (
      signupQuestions.some(
        (signupQuestion) =>
          signupQuestion.programItemId === programItem.programItemId,
      )
    ) {
      setHasSignupQuestion(true);
    }
  }, [programItem.programItemId, hiddenProgramItems, signupQuestions]);

  const updateHidden = async (): Promise<void> => {
    setSubmitting(true);

    const newHidden = !hidden;

    const programItemIndex = hiddenProgramItems.findIndex(
      (p) => p.programItemId === programItem.programItemId,
    );
    const allHiddenProgramItems = [...hiddenProgramItems];

    if (newHidden && programItemIndex === -1) {
      allHiddenProgramItems.push(programItem);
    } else if (!newHidden && programItemIndex > -1) {
      allHiddenProgramItems.splice(programItemIndex, 1);
    }

    const error = await dispatch(
      submitUpdateHidden(
        allHiddenProgramItems.map(
          (hiddenProgramItem) => hiddenProgramItem.programItemId,
        ),
      ),
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.log(`submitUpdateHidden error: ${error}`);
    } else {
      setHidden(newHidden);
    }

    setSubmitting(false);
  };

  const deleteSignupQuestion = async (): Promise<void> => {
    setSubmitting(true);

    const error = await dispatch(
      submitDeleteSignupQuestion(programItem.programItemId),
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.log(`deleteSignupQuestion error: ${error}`);
    } else {
      setHasSignupQuestion(false);
    }

    setSubmitting(false);
  };

  // Each select option is edited through two inputs, one per language, so an
  // edit merges into whatever the other language already put there. The inputs
  // can be filled in any order, and an option is only valid with both languages
  // set, so the entries up to the edited one are filled in rather than left as
  // holes the server would reject
  const updateSelectOption = (
    index: number,
    option: Partial<SignupQuestionSelectOption>,
  ): void => {
    setSelectOptions((previousOptions) => {
      const updatedOptions = [...previousOptions];
      while (updatedOptions.length <= index) {
        updatedOptions.push({ optionFi: "", optionEn: "" });
      }
      updatedOptions[index] = { ...updatedOptions[index], ...option };
      return updatedOptions;
    });
  };

  const addSignupQuestion = async (): Promise<void> => {
    setSubmitting(true);

    const error = await dispatch(
      submitAddSignupQuestion({
        programItemId: programItem.programItemId,
        questionFi: signupQuestionInputFi,
        questionEn: signupQuestionInputEn,
        private: isPrivateSignupQuestion,
        type: questionType,
        selectOptions,
      }),
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.log(`addSignupQuestion error: ${error}`);
    } else {
      setHasSignupQuestion(true);
    }

    setSubmitting(false);

    // Clear inputs
    setSignupQuestionInputVisible(false);
    setSignupQuestionInputFi("");
    setSignupQuestionInputEn("");
    setIsPrivateSignupQuestion(false);
  };

  return (
    <Container>
      <HeaderContainer>
        <h4>{t("programItemInfo.adminActions")}</h4>
        {submitting && (
          <img alt={t("loading")} src={loaderImage} height="24" width="24" />
        )}
      </HeaderContainer>
      <ButtonGroup>
        <Button
          key="hideButton"
          disabled={submitting}
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={async () => await updateHidden()}
        >
          {t(hidden ? "button.showProgramItem" : "button.hideProgramItem")}
        </Button>
        {hasSignupQuestion && (
          <Button
            key="signUpButton"
            disabled={submitting}
            buttonStyle={ButtonStyle.PRIMARY}
            onClick={deleteSignupQuestion}
          >
            {t("button.removeSignupQuestion")}
          </Button>
        )}
        {!hasSignupQuestion &&
          !signupQuestionInputVisible &&
          programItem.signupStrategy !== ProgramItemSignupStrategy.LOTTERY && (
            <Button
              key="addSignUpQuestionButton"
              disabled={submitting}
              buttonStyle={ButtonStyle.PRIMARY}
              onClick={() =>
                setSignupQuestionInputVisible(!signupQuestionInputVisible)
              }
            >
              {t("button.addSignupQuestion")}
            </Button>
          )}
      </ButtonGroup>
      {signupQuestionInputVisible && (
        <WithRowGap>
          <span>{t("signupQuestion.addSignupTextField")}</span>
          <ControlledInput
            placeholder={t("signupQuestion.inFinnish")}
            value={signupQuestionInputFi}
            onChange={(event) => setSignupQuestionInputFi(event.target.value)}
          />
          <ControlledInput
            placeholder={t("signupQuestion.inEnglish")}
            value={signupQuestionInputEn}
            onChange={(event) => setSignupQuestionInputEn(event.target.value)}
          />
          <Checkbox
            checked={isPrivateSignupQuestion}
            onChange={() => {
              setIsPrivateSignupQuestion(!isPrivateSignupQuestion);
            }}
            label={t("signupQuestion.privateQuestion")}
            id={"privateQuestionCheckbox"}
          />

          <div>
            <span>{t("signupQuestion.questionType")}</span>{" "}
            <Dropdown
              options={Object.values(SignupQuestionType).map((type) => ({
                value: type,
                title: t(`signupQuestionType.${type}`),
              }))}
              selectedValue={questionType}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setQuestionType(event.target.value as SignupQuestionType)
              }
            />
          </div>

          {questionType === SignupQuestionType.SELECT && (
            <>
              <InputsContainer>
                <span>{t("signupQuestion.inFinnish")}</span>
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(0, { optionFi: event.target.value })
                  }
                />
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(1, { optionFi: event.target.value })
                  }
                />
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(2, { optionFi: event.target.value })
                  }
                />
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(3, { optionFi: event.target.value })
                  }
                />
              </InputsContainer>
              <InputsContainer>
                <span>{t("signupQuestion.inEnglish")}</span>
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(0, { optionEn: event.target.value })
                  }
                />
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(1, { optionEn: event.target.value })
                  }
                />
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(2, { optionEn: event.target.value })
                  }
                />
                <UncontrolledInput
                  onChange={(event) =>
                    updateSelectOption(3, { optionEn: event.target.value })
                  }
                />
              </InputsContainer>
            </>
          )}

          <ButtonGroup>
            <Button
              onClick={addSignupQuestion}
              buttonStyle={ButtonStyle.PRIMARY}
            >
              {t("button.save")}
            </Button>
            <Button
              disabled={submitting}
              buttonStyle={ButtonStyle.SECONDARY}
              onClick={() => setSignupQuestionInputVisible(false)}
            >
              {t("button.cancel")}
            </Button>
          </ButtonGroup>
        </WithRowGap>
      )}
    </Container>
  );
};

const Container = styled.div`
  border: 1px solid ${(props) => props.theme.borderActive};
  border-radius: 4px;
  margin: 8px 0;
  padding: 16px 8px 8px 8px;
  h4 {
    margin-bottom: 4px;
    margin-top: 4px;
  }
`;

const HeaderContainer = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const WithRowGap = styled.div`
  row-gap: 8px;
  display: grid;
  padding-top: 8px;
`;

const InputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  @media (min-width: ${(props) => props.theme.breakpointPhoneMin}) {
    max-width: 40%;
  }
`;
