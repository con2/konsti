import { Record, String, Static } from "runtypes";
import { SIGNUP_MESSAGE_LENGTH } from "shared/constants/validation";
import { ServerError } from "shared/typings/api/errors";
import { SelectedGame } from "shared/typings/models/user";

export interface PostSignupResponse {
  message: string;
  signedGames: readonly SelectedGame[];
  status: "success";
}

export interface PostSignupTimeResponse {
  message: string;
  signupTime: string;
  status: "success";
}

export interface SignupData {
  username: string;
  selectedGames: readonly SelectedGame[];
  signupTime: string;
}

export interface PostEnteredGameResponse {
  message: string;
  status: "success";
  enteredGame: SelectedGame;
}

export interface PostEnteredGameError extends ServerError {
  code: 0 | 51;
}

export interface DeleteEnteredGameResponse {
  message: string;
  status: "success";
}

export const PostEnteredGameParametersRuntype = Record({
  username: String,
  enteredGameId: String,
  startTime: String,
  message: String.withConstraint(
    (message) =>
      message.length <= SIGNUP_MESSAGE_LENGTH ||
      `Message too long: ${message.length}/${SIGNUP_MESSAGE_LENGTH}`
  ),
});

export type PostEnteredGameParameters = Static<
  typeof PostEnteredGameParametersRuntype
>;

export const DeleteEnteredGameParametersRuntype = Record({
  username: String,
  enteredGameId: String,
  startTime: String,
});

export type DeleteEnteredGameParameters = Static<
  typeof DeleteEnteredGameParametersRuntype
>;
