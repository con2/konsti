import React, { ReactElement, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { timeFormatter } from "client/utils/timeFormatter";
import { useAppSelector } from "client/utils/hooks";
import { SelectedGame } from "shared/typings/models/user";
import { CancelSignupForm } from "client/views/all-games/components/CancelSignupForm";
import { Button, ButtonStyle } from "client/components/Button";

interface Props {
  signups: readonly SelectedGame[];
  startTimes: readonly string[];
  missedSignups: readonly string[];
}

export const ResultsByStartTimes = ({
  signups,
  startTimes,
  missedSignups,
}: Props): ReactElement => {
  const [showCancelSignupForm, setShowCancelSignupForm] = useState<String[]>(
    []
  );

  const signupMessages = useAppSelector((state) => state.admin.signupMessages);
  const { t } = useTranslation();
  return (
    <div>
      {startTimes.map((startTime) => {
        return (
          <div key={startTime}>
            <StyledTime>
              {timeFormatter.getWeekdayAndTime({
                time: startTime,
                capitalize: true,
              })}
            </StyledTime>
            {signups.map((signup) => {
              const cancelSignupFormVisible = showCancelSignupForm.find(
                (signupform) => signupform === signup.gameDetails.gameId
              );
              const onCancelForm = (): void => {
                setShowCancelSignupForm(
                  showCancelSignupForm.filter(
                    (signupform) => signupform !== signup.gameDetails.gameId
                  )
                );
              };

              const onCancelSignup = (): void => {
                setShowCancelSignupForm(
                  showCancelSignupForm.filter(
                    (signupform) => signupform !== signup.gameDetails.gameId
                  )
                );
              };
              const onConfirmCancelSignup = (): void => {
                setShowCancelSignupForm([
                  ...showCancelSignupForm,
                  signup.gameDetails.gameId,
                ]);
              };

              if (signup.time === startTime) {
                const showSignupMessage = signupMessages.find(
                  (message) => message.gameId === signup.gameDetails.gameId
                );
                return (
                  <GameDetailsList key={signup.gameDetails.gameId}>
                    <Link to={`/games/${signup.gameDetails.gameId}`}>
                      {signup.gameDetails.title}
                    </Link>

                    <ButtonContainer>
                      {cancelSignupFormVisible ? (
                        <CancelSignupForm
                          game={signup.gameDetails}
                          onCancelForm={onCancelForm}
                          onCancelSignup={onCancelSignup}
                        />
                      ) : (
                        <Button
                          onClick={() => onConfirmCancelSignup()}
                          buttonStyle={ButtonStyle.NORMAL}
                        >
                          {t("button.cancelSignup")}
                        </Button>
                      )}
                    </ButtonContainer>

                    {!!showSignupMessage && (
                      <SignupMessagePlacement>
                        <FontAwesomeIcon icon={"comment"} />
                        {` ${t("myGamesView.yourAnswer")} "${
                          showSignupMessage.message
                        }": ${signup.message}`}
                      </SignupMessagePlacement>
                    )}
                  </GameDetailsList>
                );
              }
            })}

            {missedSignups.map((missedSignup) => {
              if (missedSignup === startTime) {
                return (
                  <GameDetailsList key={missedSignup}>
                    {t("noSignupResult")}
                  </GameDetailsList>
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
};

const GameDetailsList = styled.div`
  display: flex;
  align-items: center;
  padding-left: 30px;
`;

const ButtonContainer = styled.div`
  padding-left: 10px;
`;

const SignupMessagePlacement = styled.div`
  padding-top: 5px;
`;

const StyledTime = styled.p`
  font-weight: 600;
`;
