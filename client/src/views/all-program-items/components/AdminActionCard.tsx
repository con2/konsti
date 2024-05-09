import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import loaderImage from "assets/loading.gif";
import { ProgramItem } from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import {
  submitAddSignupQuestion,
  submitDeleteSignupQuestion,
  submitUpdateHidden,
} from "client/views/admin/adminThunks";
import { ButtonGroup } from "client/components/ButtonGroup";
import { ControlledInput } from "client/components/ControlledInput";
import { Dropdown } from "client/components/Dropdown";
import {
  SignupQuestionSelectOption,
  SignupQuestionType,
} from "shared/types/models/settings";
import { Checkbox } from "client/components/Checkbox";

interface Props {
  programItem: ProgramItem;
}

export const AdminActionCard = ({ programItem }: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const hiddenGames = useAppSelector((state) => state.admin.hiddenProgramItems);
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    hiddenGames.find((hiddenGame) => {
      if (hiddenGame.programItemId === programItem.programItemId) {
        setHidden(true);
      }
    });

    // Check if signup question exists
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    signupQuestions.find((signupQuestion) => {
      if (signupQuestion.programItemId === programItem.programItemId) {
        setHasSignupQuestion(true);
      }
    });
  }, [programItem.programItemId, hiddenGames, signupQuestions]);

  const updateHidden = async (): Promise<void> => {
    setSubmitting(true);

    const newHidden = !hidden;

    const gameIndex = hiddenGames.findIndex(
      (g) => g.programItemId === programItem.programItemId,
    );
    const allHiddenGames = hiddenGames.slice();

    if (newHidden && gameIndex === -1) {
      allHiddenGames.push(programItem);
    } else if (!newHidden && gameIndex > -1) {
      allHiddenGames.splice(gameIndex, 1);
    }

    try {
      await dispatch(submitUpdateHidden(allHiddenGames));
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw new Error(`submitUpdateHidden error: ${error}`);
    } finally {
      setSubmitting(false);
    }

    setHidden(newHidden);
  };

  const deleteSignupQuestion = async (): Promise<void> => {
    setSubmitting(true);

    try {
      await dispatch(submitDeleteSignupQuestion(programItem.programItemId));
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw new Error(`deleteSignupQuestion error: ${error}`);
    } finally {
      setSubmitting(false);
    }
    setHasSignupQuestion(false);
  };

  const addSignupQuestion = async (): Promise<void> => {
    setSubmitting(true);

    try {
      await dispatch(
        submitAddSignupQuestion({
          programItemId: programItem.programItemId,
          questionFi: signupQuestionInputFi,
          questionEn: signupQuestionInputEn,
          private: isPrivateSignupQuestion,
          type: questionType,
          selectOptions,
        }),
      );
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax -- TODO: Remove throw
      throw new Error(`addSignupQuestion error: ${error}`);
    } finally {
      setSubmitting(false);
    }
    setHasSignupQuestion(true);

    // Clear inputs
    setSignupQuestionInputVisible(false);
    setSignupQuestionInputFi("");
    setSignupQuestionInputEn("");
    setIsPrivateSignupQuestion(false);
  };

  return (
    <Container>
      <HeaderContainer>
        <h4>{t("gameInfo.adminActions")}</h4>
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
          {hidden ? t("button.showProgramItem") : t("button.hideProgramItem")}
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
        {!hasSignupQuestion && !signupQuestionInputVisible && (
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
              <div>
                <span>{t("signupQuestion.inFinnish")}</span>
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[0] = {
                      ...newState[0],
                      optionFi: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[1] = {
                      ...newState[1],
                      optionFi: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />{" "}
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[2] = {
                      ...newState[2],
                      optionFi: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[3] = {
                      ...newState[3],
                      optionFi: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />
              </div>
              <div>
                <span>{t("signupQuestion.inEnglish")}</span>
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[0] = {
                      ...newState[0],
                      optionEn: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[1] = {
                      ...newState[1],
                      optionEn: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />{" "}
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[2] = {
                      ...newState[2],
                      optionEn: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />
                <input
                  onChange={(event) => {
                    const newState = selectOptions;
                    newState[3] = {
                      ...newState[3],
                      optionEn: event.target.value,
                    };
                    setSelectOptions(newState);
                  }}
                />
              </div>
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
