import { ReactElement } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { SignupQuestion } from "shared/types/models/settings";

interface Props {
  signupQuestion: SignupQuestion;
  signupMessage: string;
}

export const SignupQuestionAnswer = ({
  signupQuestion,
  signupMessage,
}: Props): ReactElement => {
  const { t, i18n } = useTranslation();

  return (
    <SignupQuestion>
      <FontAwesomeIcon icon={["far", "comment"]} aria-hidden="true" />
      {` ${t("myProgramView.yourAnswer")} "${
        i18n.language === "fi"
          ? signupQuestion.questionFi
          : signupQuestion.questionEn
      }"${
        signupQuestion.private
          ? ` (${t("privateOnlyVisibleToOrganizers")})`
          : ""
      }: ${signupMessage}`}
    </SignupQuestion>
  );
};

const SignupQuestion = styled.p`
  padding: 0;
  margin: 8px 0 4px 0;
  color: ${(props) => props.theme.textSecondary};
`;
