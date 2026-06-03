import * as yup from 'yup'

/** POST /auth/login */
export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Введите email')
    .email('Введите корректный email'),
  password: yup
    .string()
    .required('Введите пароль'),
})
