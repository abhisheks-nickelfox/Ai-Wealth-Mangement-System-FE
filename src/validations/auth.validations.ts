import * as Yup from 'yup';

export const loginSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address (e.g. you@example.com)')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address (e.g. you@example.com)')
    .required('Email is required'),
});

export const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .required('Please choose a new password'),
  confirm: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match — please re-enter')
    .required('Please confirm your new password'),
});

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string()
    .required('Please enter your current password'),
  newPassword: Yup.string()
    .min(8, 'New password must be at least 8 characters long')
    .required('Please enter a new password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match — please re-enter')
    .required('Please confirm your new password'),
});
