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
