import { check } from 'express-validator';

export const postUserValidation = [
  check('username').not().isEmpty().isLength({ max: 20 }).trim().escape(),
  check('password').not().isEmpty().trim().escape(),
  check('serial').not().isEmpty().trim().escape(),
];

export const postLoginValidation = [
  check('username').trim().escape(),
  check('password').trim().escape(),
  check('jwt').trim().escape(),
];
