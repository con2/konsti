import React, { ReactElement, ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { postFeedback } from "client/services/feedbackServices";
import { Game } from "shared/typings/models/game";
import { Button, ButtonStyle } from "client/components/Button";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  game: Game;
}

export const FeedbackForm = ({ game }: Props): ReactElement => {
  const username = useAppSelector((state) => state.login.username);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackValue, setFeedbackValue] = useState<string>("");
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const { t } = useTranslation();

  // Hide / show clicked
  const sendFeedbackEvent = async (): Promise<void> => {
    setSubmitting(true);

    const feedbackData = {
      gameId: game.gameId,
      feedback: feedbackValue,
      username,
    };

    try {
      await postFeedback(feedbackData);
    } catch (error) {
      console.log(`postFeedback error:`, error); // eslint-disable-line no-console
    }
    setFeedbackSent(true);
    setSubmitting(false);
  };

  const handleFeedbackChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setFeedbackValue(event.target.value);
  };

  return (
    <div>
      <Title>{t("feedbackTitle")}</Title>
      <p>{t("feedbackInstruction")}</p>

      {!feedbackSent && (
        <>
          <FeedbackTextarea
            value={feedbackValue}
            onChange={handleFeedbackChange}
            rows={4}
          />

          <Button
            buttonStyle={submitting ? ButtonStyle.DISABLED : ButtonStyle.NORMAL}
            onClick={async () => await sendFeedbackEvent()}
          >
            {t("button.sendFeedback")}
          </Button>
        </>
      )}

      {feedbackSent && (
        <SuccessMessage>{t("button.feedbackSent")}</SuccessMessage>
      )}
    </div>
  );
};

const FeedbackTextarea = styled.textarea`
  width: 95%;
  border: 1px solid black;
  resize: none;
  overflow: auto;
`;

const SuccessMessage = styled.p`
  color: ${(props) => props.theme.textSuccess};
`;

const Title = styled.p`
  font-weight: 600;
`;
