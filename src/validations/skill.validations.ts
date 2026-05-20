import * as Yup from 'yup';

export const createSkillSchema = Yup.object({
  name: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'Skill name must contain at least one letter')
    .required('Please enter a name for this skill'),
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
    .min(1, 'Please enter at least 1 year of experience')
    .max(50, 'Experience cannot exceed 50 years')
    .integer('Please enter a whole number (e.g. 3)')
    .required('Please enter years of experience for this skill'),
});
