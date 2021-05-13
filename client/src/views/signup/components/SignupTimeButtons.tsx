import React, { FC, ReactElement } from 'react';
import styled from 'styled-components';
import { timeFormatter } from 'client/utils/timeFormatter';
import { submitSignupTime } from 'client/views/signup/signupActions';
import { useAppDispatch } from 'client/utils/hooks';
import { AppDispatch } from 'client/typings/redux.typings';

interface Props {
  signupTimes: readonly string[];
  signupTime: string;
}

export const SignupTimeButtons: FC<Props> = (props: Props): ReactElement => {
  const { signupTimes, signupTime } = props;

  const dispatch = useAppDispatch();

  const getIsActive = (isActive: boolean): string => (isActive ? 'active' : '');

  return (
    <>
      {signupTimes.map((time) => {
        return (
          <StyledButton
            key={time}
            onClick={() => selectSignupTime(time, dispatch)}
            className={`button-${time} ${getIsActive(time === signupTime)}`}
            disabled={time === signupTime}
          >
            {timeFormatter.getWeekdayAndTime({ time: time, capitalize: true })}
          </StyledButton>
        );
      })}
    </>
  );
};

const selectSignupTime = (signupTime: string, dispatch: AppDispatch): void => {
  dispatch(submitSignupTime(signupTime));
};

const StyledButton = styled.button`
  &.active {
    background-color: ${(props) => props.theme.buttonSelected};
    border: 1px solid ${(props) => props.theme.borderActive};
  }
`;
