import * as Yup from 'yup';

export const createUserSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address (e.g. you@example.com)')
    .required('Email address is required'),
  role: Yup.string()
    .oneOf(['admin', 'member', 'project_manager'], 'Please select a valid role')
    .required('Please select a role for this user'),
  rateAmount: Yup.string()
    .optional()
    .test('is-valid-number', 'Rate must be 0 or a positive number', (val) => {
      if (!val) return true;
      const n = parseFloat(val);
      return !Number.isNaN(n) && n >= 0;
    })
    .test('max-rate', 'Rate is too high — maximum allowed is 99,999,999', (val) => {
      if (!val) return true;
      return parseFloat(val) <= 99_999_999.99;
    }),
  rateFrequency: Yup.string()
    .oneOf(['Hourly', 'Daily', 'Weekly', 'Monthly'])
    .optional(),
});

export const editUserSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'First name must contain at least one letter')
    .optional(),
  lastName: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'Last name must contain at least one letter')
    .optional(),
  role: Yup.string()
    .oneOf(['admin', 'member', 'project_manager'], 'Please select a valid role')
    .optional(),
  status: Yup.string()
    .oneOf(['Active', 'invited', 'Disabled'])
    .optional(),
  rateAmount: Yup.string()
    .optional()
    .test('is-valid-number', 'Rate must be 0 or a positive number', (val) => {
      if (!val) return true;
      const n = parseFloat(val);
      return !Number.isNaN(n) && n >= 0;
    })
    .test('max-rate', 'Rate is too high — maximum allowed is 99,999,999', (val) => {
      if (!val) return true;
      return parseFloat(val) <= 99_999_999.99;
    }),
});

export const userSettingsSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'First name must contain at least one letter')
    .required('First name is required'),
  lastName: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'Last name must contain at least one letter')
    .required('Last name is required'),
});
