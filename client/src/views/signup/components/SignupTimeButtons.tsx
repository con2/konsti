import React, { ReactElement } from "react";
import { timeFormatter } from "client/utils/timeFormatter";
import { submitSignupTime } from "client/views/signup/signupSlice";
import { useAppDispatch } from "client/utils/hooks";
import { Button } from "client/components/Button";

interface Props {
  signupTimes: readonly string[];
  signupTime: string;
}

export const SignupTimeButtons = ({
  signupTimes,
  signupTime,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();

  const selectSignupTime = (selectedSignupTime: string): void => {
    dispatch(submitSignupTime(selectedSignupTime));
  };

  return (
    <>
      {signupTimes.map((time) => {
        return (
          <Button
            key={time}
            onClick={() => selectSignupTime(time)}
            selected={time === signupTime}
            disabled={time === signupTime}
          >
            {timeFormatter.getWeekdayAndTime({ time: time, capitalize: true })}
          </Button>
        );
      })}
    </>
  );
};
