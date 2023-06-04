import bcrypt from "bcryptjs";
import { logger } from "server/utils/logger";
import { BcryptError } from "shared/typings/api/errors";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

const saltLength = 10;

export const hashPassword = async (
  password: string
): Promise<Result<string, BcryptError>> => {
  try {
    const result = await bcrypt.hash(password, saltLength);
    return makeSuccessResult(result);
  } catch (error) {
    logger.error("bcrypt.hash error: %s", error);
    return makeErrorResult(BcryptError.UNKNOWN_ERROR);
  }
};

const comparePasswordHash = async (
  password: string,
  hash: string
): Promise<Result<boolean, BcryptError>> => {
  try {
    const result = await bcrypt.compare(password, hash);
    return makeSuccessResult(result);
  } catch (error) {
    logger.error("bcrypt.compare error: %s", error);
    return makeErrorResult(BcryptError.UNKNOWN_ERROR);
  }
};

export const validateLogin = async (
  password: string,
  hash: string
): Promise<Result<boolean, BcryptError>> => {
  const hashResponseResult = await comparePasswordHash(password, hash);
  if (isErrorResult(hashResponseResult)) {
    return hashResponseResult;
  }

  const hashResponse = unwrapResult(hashResponseResult);

  if (hashResponse) {
    return makeSuccessResult(true);
  }

  return makeSuccessResult(false);
};
