import bcrypt from "bcryptjs";
import { logger } from "server/utils/logger";
import { BcryptError } from "shared/typings/api/errors";
import {
  AsyncResult,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/asyncResult";

const saltLength = 10;

const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, saltLength);
  } catch (error) {
    logger.error(`bcrypt.hash error: ${error}`);
  }
  return "hash-error";
};

const comparePasswordHash = async (
  password: string,
  hash: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error(`bcrypt.compare error: ${error}`);
  }
  return false;
};

const validateLogin = async (
  password: string,
  hash: string
): Promise<AsyncResult<boolean, BcryptError>> => {
  let hashResponse;
  try {
    hashResponse = await comparePasswordHash(password, hash);
  } catch (error) {
    logger.error(`comparePasswordHash error: ${error}`);
    return makeErrorResult(BcryptError.UNKNOWN_ERROR);
  }

  if (hashResponse) {
    return makeSuccessResult(true);
  }

  return makeSuccessResult(false);
};

export { hashPassword, validateLogin };
