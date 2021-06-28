import { check, ValidationChain } from 'express-validator';
import { sharedConfig } from 'shared/config/sharedConfig';
import { ConventionType } from 'shared/config/sharedConfig.types';
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from 'shared/constants/validation';

export const postUserValidation = (): ValidationChain[] => {
  const validation = [
    check('username')
      .not()
      .isEmpty()
      .isLength({ min: USERNAME_LENGTH_MIN, max: USERNAME_LENGTH_MAX })
      .trim()
      .escape(),
    check('password')
      .not()
      .isEmpty()
      .isLength({ min: PASSWORD_LENGTH_MIN, max: PASSWORD_LENGTH_MAX })
      .trim()
      .escape(),
  ];

  if (sharedConfig.conventionType === ConventionType.LIVE) {
    validation.push(check('serial').not().isEmpty().trim().escape());
  }

  return validation;
};

export const postLoginValidation = [
  check('username').trim().escape(),
  check('password').trim().escape(),
  check('jwt').trim().escape(),
];
