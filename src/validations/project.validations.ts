import * as Yup from 'yup';

export const createProjectSchema = Yup.object({
  name: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'Project name must contain at least one letter')
    .required('Project name is required'),
  description: Yup.string()
    .trim()
    .optional(),
  workflowStatus: Yup.string()
    .oneOf(['todo', 'in_progress', 'in_review', 'approved', 'completed'])
    .optional(),
});
