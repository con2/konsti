import { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { postFeedback } from "client/services/feedbackServices";
import { ProgramItem } from "shared/types/models/programItem";
import { Button, ButtonStyle } from "client/components/Button";
import { TextArea } from "client/components/TextArea";

interface Props {
  programItem: ProgramItem;
}

export const FeedbackForm = ({ programItem }: Props): ReactElement => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackValue, setFeedbackValue] = useState<string>("");
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const { t } = useTranslation();

  // Hide / show clicked
  const sendFeedbackEvent = async (): Promise<void> => {
    if (feedbackValue.length === 0) {
      return;
    }
    setSubmitting(true);

    try {
      await postFeedback(programItem.programItemId, feedbackValue);
    } catch (error) {
      console.log(`postFeedback error:`, error); // eslint-disable-line no-console
    }
    setFeedbackSent(true);
    setSubmitting(false);
  };

  const handleFeedbackChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    setFeedbackValue(event.target.value);
  };

  return (
    <div>
      <Title>{t("feedbackTitle")}</Title>
      <p>
        {t("feedbackInstruction", {
          PROGRAM_TYPE: t(`programTypeElative.${programItem.programType}`),
        })}
      </p>

      {!feedbackSent && (
        <>
          <FeedbackTextArea
            value={feedbackValue}
            onChange={handleFeedbackChange}
          />

          <ButtonWithMargin
            disabled={submitting}
            buttonStyle={ButtonStyle.SECONDARY}
            onClick={async () => await sendFeedbackEvent()}
          >
            {t("button.sendFeedback")}
          </ButtonWithMargin>
        </>
      )}

      {feedbackSent && (
        <SuccessMessage>{t("button.feedbackSent")}</SuccessMessage>
      )}
    </div>
  );
};

const FeedbackTextArea = styled(TextArea)`
  width: 100%;
  box-sizing: border-box;
`;

const SuccessMessage = styled.p`
  color: ${(props) => props.theme.textSecondary};
`;

const Title = styled.p`
  font-weight: 600;
`;

const ButtonWithMargin = styled(Button)`
  margin: 8px 0 16px 0;
`;
