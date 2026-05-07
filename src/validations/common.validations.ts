import * as Yup from 'yup';

export const nameValidator = Yup.string()
  .trim()
  .matches(/[a-zA-Z]/, 'Must contain at least one letter');

export const emailValidator = Yup.string()
  .email('Enter a valid email');

export const passwordValidator = Yup.string()
  .min(8, 'Must be at least 8 characters');

export const experienceValidator = Yup.number()
  .min(1, 'Minimum 1 year')
  .max(50, 'Maximum 50 years')
  .integer('Must be a whole number');
