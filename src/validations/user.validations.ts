import * as Yup from 'yup';

export const createUserSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Email is required'),
  role: Yup.string()
    .oneOf(['admin', 'member', 'project_manager'], 'Select a valid role')
    .required('Role is required'),
  rateAmount: Yup.string()
    .optional()
    .test('is-valid-number', 'Rate must be a positive number', (val) => {
      if (!val) return true;
      const n = parseFloat(val);
      return !Number.isNaN(n) && n >= 0;
    })
    .test('max-rate', 'Rate cannot exceed 99,999,999.99', (val) => {
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
    .oneOf(['admin', 'member', 'project_manager'], 'Select a valid role')
    .optional(),
  status: Yup.string()
    .oneOf(['Active', 'invited', 'Disabled'])
    .optional(),
  rateAmount: Yup.string()
    .optional()
    .test('is-valid-number', 'Rate must be a positive number', (val) => {
      if (!val) return true;
      const n = parseFloat(val);
      return !Number.isNaN(n) && n >= 0;
    })
    .test('max-rate', 'Rate cannot exceed 99,999,999.99', (val) => {
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
