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
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be 100 characters or fewer')
    .matches(/[a-zA-Z]/, 'Location must contain at least one letter')
    .required('Location is required'),
  website: Yup.string()
    .trim()
    .matches(URL_REGEX, 'Please enter a valid website URL (e.g. www.example.com)')
    .required('Firm website is required'),
  description: Yup.string()
    .trim()
    .optional()
    .test('min-length', 'Description must be at least 10 characters', (val) => {
      if (!val || !val.trim()) return true;
      return val.trim().length >= 10;
    })
    .max(500, 'Description must be 500 characters or fewer'),
});

export const firmStep2Schema = Yup.object({
  contactName: Yup.string()
    .trim()
    .required('Contact name is required')
    .min(2, 'Contact name must be at least 2 characters')
    .matches(/[a-zA-Z]/, 'Contact name must contain at least one letter'),
  contactRole: Yup.string()
    .trim()
    .optional()
    .test('has-letter', 'Contact role must contain at least one letter', (val) => {
      if (!val || !val.trim()) return true;
      return /[a-zA-Z]/.test(val);
    }),
  contactEmail: Yup.string()
    .required('Email is required')
    .test('valid-email', 'Please enter a valid email address', (val) => {
      if (!val || !val.trim()) return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    }),
  // contactPhone validated manually in onSubmit (outside Formik state)
});
