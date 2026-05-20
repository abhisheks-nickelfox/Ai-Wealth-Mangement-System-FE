import * as Yup from 'yup';

export const passwordStepSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .required('Please choose a password'),
  confirm: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match — please re-enter')
    .required('Please confirm your password'),
});

export const personalDetailsSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'First name must contain at least one letter')
    .required('First name is required'),
  lastName: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'Last name must contain at least one letter')
    .required('Last name is required'),
  phoneNumber: Yup.string()
    .optional()
    .test('e164-format', 'Please enter a valid phone number including your country code (e.g. +1 202 555 1234)', (val) => {
      if (!val || !val.trim()) return true;
      return /^\+[1-9]\d{6,14}$/.test(val);
    }),
});

// Skills step: validated imperatively on submit (complex multi-row state)
// Use getSkillsValidationError() helper in the component directly
export const skillsStepSchema = Yup.object({
  // Placeholder — actual validation done imperatively in the component
  // via getSkillsValidationError() to handle the multi-row structure
});
