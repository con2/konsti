import { check, ValidationChain } from 'express-validator';
import { sharedConfig } from 'shared/config/sharedConfig';
import { ConventionType } from 'shared/config/sharedConfig.types';

export const postUserValidation = (): ValidationChain[] => {
  const validation = [
    check('username').not().isEmpty().isLength({ max: 20 }).trim().escape(),
    check('password').not().isEmpty().trim().escape(),
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
