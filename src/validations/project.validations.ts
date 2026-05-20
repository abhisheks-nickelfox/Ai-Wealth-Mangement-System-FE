import * as Yup from 'yup';

export const createProjectSchema = Yup.object({
  name: Yup.string()
    .trim()
    .matches(/[a-zA-Z]/, 'Project name must contain at least one letter')
    .required('Please enter a name for this project'),
  description: Yup.string()
    .trim()
    .optional(),
  workflowStatus: Yup.string()
    .oneOf(['todo', 'in_progress', 'in_review', 'approved', 'completed'])
    .optional(),
});
