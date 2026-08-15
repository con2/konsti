import { z } from "zod";
import { StoredEmailSchema } from "shared/constants/validation";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { EventLogItem } from "shared/types/models/eventLog";
import { UserGroup } from "shared/types/models/user";

// POST login

export const PostLoginRequestSchema = z.object({
  username: z.string(),
  // Trim to match registration/password-update, which store the trimmed password — otherwise
  // a trailing/leading space typed at login would never match the stored hash
  password: z.string().trim().min(1),
});

export type PostLoginRequest = z.infer<typeof PostLoginRequestSchema>;

export interface PostLoginResult extends ApiResult {
  groupCode: string;
  isGroupCreator: boolean;
  jwt: string;
  serial: string;
  userGroup: UserGroup;
  username: string;
  eventLogItems: EventLogItem[];
  kompassiUsernameAccepted: boolean;
  // The Kompassi OIDC `sub` claim, or "" for a local account. Opaque: Kompassi
  // makes no promises about its format
  kompassiId: string;
  email: string;
  emailNotificationPermitAsked: boolean;
}

interface PostLoginError extends ApiError {
  errorId: "unknown" | "loginFailed" | "loginDisabled";
}

export type PostLoginResponse = PostLoginResult | PostLoginError;

// POST session recovery

export const PostSessionRecoveryRequestSchema = z.object({ jwt: z.string() });

export type PostSessionRecoveryRequest = z.infer<
  typeof PostSessionRecoveryRequestSchema
>;

// Same success shape as a login, but the failures differ: recovery can fail
// because the stored token itself is unusable, which a login can't. Keeping
// that out of PostLoginError spares the login paths a case they never see
export interface PostSessionRecoveryError extends ApiError {
  errorId: "unknown" | "loginFailed" | "loginDisabled" | "sessionExpired";
}

export type PostSessionRecoveryResponse =
  | PostLoginResult
  | PostSessionRecoveryError;

// POST Kompassi login redirect

// The client generates the OAuth state and keeps its own copy, so the server
// stays stateless and any instance can build the authorization URL
export const PostKompassiLoginRedirectRequestSchema = z.object({
  state: z.string().min(1),
});

export type PostKompassiLoginRedirectRequest = z.infer<
  typeof PostKompassiLoginRedirectRequestSchema
>;

// POST Kompassi login

export const PostKompassiLoginRequestSchema = z.object({ code: z.string() });

export type PostKompassiLoginRequest = z.infer<
  typeof PostKompassiLoginRequestSchema
>;

type PostKompassiLoginResult = PostLoginResult;

interface PostKompassiLoginError extends ApiError {
  errorId: "unknown" | "loginFailed" | "loginDisabled" | "invalidUserGroup";
}

export type PostKompassiLoginResponse =
  | PostKompassiLoginResult
  | PostKompassiLoginError;

// POST Verify Kompassi login

export const PostVerifyKompassiLoginRequestSchema = z.object({
  username: z.string().trim(),
});

export type PostVerifyKompassiLoginRequest = z.infer<
  typeof PostVerifyKompassiLoginRequestSchema
>;

export interface PostVerifyKompassiLoginPayload {
  username: string;
  kompassiUsernameAccepted: boolean;
  jwt: string;
}

export type PostVerifyKompassiLoginResult = PostVerifyKompassiLoginPayload &
  ApiResult;

export interface PostVerifyKompassiLoginError extends ApiError {
  errorId: "unknown" | "usernameNotFree" | "loginFailed";
}

export type PostVerifyKompassiLoginResponse =
  | PostVerifyKompassiLoginResult
  | PostVerifyKompassiLoginError;

// POST Update user email address

export const PostUpdateUserEmailAddressRequestSchema = z.object({
  email: z.string().trim().pipe(StoredEmailSchema),
});

export type PostUpdateUserEmailAddressRequest = z.infer<
  typeof PostUpdateUserEmailAddressRequestSchema
>;

interface PostUpdateUserEmailAddressPayload {
  email: string;
  emailNotificationPermitAsked: boolean;
  jwt: string;
}

type PostUpdateUserEmailAddressResult = PostUpdateUserEmailAddressPayload &
  ApiResult;

interface PostUpdateUserEmailAddressError extends ApiError {
  errorId: "unknown" | "invalidEmail";
}

export type PostUpdateUserEmailAddressResponse =
  | PostUpdateUserEmailAddressResult
  | PostUpdateUserEmailAddressError;

// Finalize login

export type PostFinalizeLogin = PostUpdateUserEmailAddressPayload;
