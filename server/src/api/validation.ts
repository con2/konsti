import { check, ValidationChain } from 'express-validator';
import { sharedConfig } from 'shared/config/sharedConfig';
import { ConventionType } from 'shared/config/sharedConfig.types';
import { PASSWORD_LENGTH, USERNAME_LENGTH } from 'shared/constants/validation';

export const postUserValidation = (): ValidationChain[] => {
  const validation = [
    check('username')
      .not()
      .isEmpty()
      .isLength({ max: USERNAME_LENGTH })
      .trim()
      .escape(),
    check('password')
      .not()
      .isEmpty()
      .isLength({ max: PASSWORD_LENGTH })
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
