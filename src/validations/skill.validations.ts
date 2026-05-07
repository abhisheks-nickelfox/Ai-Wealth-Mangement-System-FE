import * as Yup from 'yup';

export const createSkillSchema = Yup.object({
  name: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'Skill name must contain at least one letter')
    .required('Skill name is required'),
  category: Yup.string()
    .trim()
    .optional(),
  description: Yup.string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
});

export const addSkillRowSchema = Yup.object({
  skillId: Yup.string()
    .required('Please select a skill'),
  experience: Yup.number()
    .min(1, 'Minimum 1 year')
    .max(50, 'Maximum 50 years')
    .integer('Must be a whole number')
    .required('Experience is required'),
});
