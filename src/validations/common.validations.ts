import * as Yup from 'yup';

export const nameValidator = Yup.string()
  .trim()
  .matches(/[a-zA-Z]/, 'Name must contain at least one letter');

export const emailValidator = Yup.string()
  .email('Please enter a valid email address (e.g. you@example.com)');

export const passwordValidator = Yup.string()
  .min(8, 'Password must be at least 8 characters long');

export const experienceValidator = Yup.number()
  .min(1, 'Please enter at least 1 year of experience')
  .max(50, 'Experience cannot exceed 50 years')
  .integer('Please enter a whole number (e.g. 3)');
