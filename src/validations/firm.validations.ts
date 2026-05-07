import * as Yup from 'yup';

const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w]{2,}(\/.*)?$/i;

export const firmStep1Schema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Firm name must be at least 2 characters')
    .max(100, 'Firm name must be 100 characters or fewer')
    .matches(/[a-zA-Z]/, 'Firm name must contain at least one letter')
    .required('Firm name is required'),
  location: Yup.string()
    .trim()
    .required('Location is required'),
  website: Yup.string()
    .trim()
    .matches(URL_REGEX, 'Please enter a valid website URL (e.g. www.example.com)')
    .required('Firm website is required'),
  description: Yup.string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .required('Description is required'),
});

export const firmStep2Schema = Yup.object({
  contactName: Yup.string()
    .trim()
    .optional()
    .test('min-length', 'Contact name must be at least 2 characters', (val) => {
      if (!val || !val.trim()) return true;
      return val.trim().length >= 2;
    })
    .test('has-letter', 'Contact name must contain at least one letter', (val) => {
      if (!val || !val.trim()) return true;
      return /[a-zA-Z]/.test(val);
    }),
  contactEmail: Yup.string()
    .optional()
    .test('valid-email', 'Please enter a valid email address', (val) => {
      if (!val || !val.trim()) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    }),
  contactPhone: Yup.string()
    .optional()
    .test('e164-format', 'Phone number must be in E.164 format (e.g. +12025551234)', (val) => {
      if (!val || !val.trim()) return true;
      return /^\+[1-9]\d{6,14}$/.test(val);
    }),
});
