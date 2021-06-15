import React, { ReactElement, ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { postFeedback } from 'client/services/feedbackServices';
import { Game } from 'shared/typings/models/game';

export interface Props {
  game: Game;
}

export const FeedbackForm = (props: Props): ReactElement => {
  const { game } = props;

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackValue, setFeedbackValue] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const { t } = useTranslation();

  // Hide / show clicked
  const sendFeedbackEvent = async (): Promise<void> => {
    setSubmitting(true);

    const feedbackData = {
      gameId: game.gameId,
      feedback: feedbackValue,
    };

    try {
      await postFeedback(feedbackData);
    } catch (error) {
      console.log(`postFeedback error:`, error);
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
    <div className='feedback-form'>
      <p className='bold'>{t('feedbackTitle')}</p>
      <p>{t('feedbackInstruction')}</p>

      {!feedbackSent && (
        <>
          <FeedbackTextarea
            value={feedbackValue}
            onChange={handleFeedbackChange}
            rows={4}
          />

          <button
            disabled={submitting}
            onClick={async () => await sendFeedbackEvent()}
          >
            {t('button.sendFeedback')}
          </button>
        </>
      )}

      {feedbackSent && (
        <SuccessMessage>{t('button.feedbackSent')}</SuccessMessage>
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
  color: ${(props) => props.theme.success};
`;
