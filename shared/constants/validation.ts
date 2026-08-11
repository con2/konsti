import { z } from "zod";

export const SIGNUP_MESSAGE_LENGTH = 140;

export const ADMIN_MESSAGE_LENGTH_MAX = 500;

export const USERNAME_LENGTH_MIN = 3;
export const USERNAME_LENGTH_MAX = 30;

// The stored-email format. Applied when reading users back out of the DB, so
// anything written that doesn't match here makes the account unreadable
export const EMAIL_REGEX = z.regexes.email;

// "" is a real value: the user has no email address, or unsubscribed
export const StoredEmailSchema = z.email().or(z.literal(""));

export const PASSWORD_LENGTH_MIN = 4;
export const PASSWORD_LENGTH_MAX = 80;
