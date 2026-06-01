import * as yup from 'yup'
import { isEmailTaken } from '../repositories/usersRepository.js'

/**
 * Схема PATCH /users/:id (форма views/users/edit.pug).
 *
 * @param {string} userId — текущий пользователь исключается из проверки уникальности email
 */
export function createUpdateUserSchema (userId) {
  return yup.object({
    username: yup
      .string()
      .trim()
      .required('Введите имя пользователя')
      .min(2, 'Имя должно содержать минимум 2 символа')
      .max(50, 'Имя не должно превышать 50 символов'),
    email: yup
      .string()
      .trim()
      .required('Введите email')
      .email('Введите корректный email')
      .test(
        'unique-email',
        'Пользователь с таким email уже существует',
        (value) => !value || !isEmailTaken(value, userId)
      ),
    // Пустые поля пароля → не менять (transform в undefined)
    password: yup
      .string()
      .transform((value) => (value === '' ? undefined : value))
      .optional()
      .min(6, 'Пароль должен содержать минимум 6 символов'),
    passwordConfirm: yup
      .string()
      .transform((value) => (value === '' ? undefined : value))
      .when('password', {
        is: (password) => Boolean(password),
        then: (schema) => schema
          .required('Подтвердите пароль')
          .oneOf([yup.ref('password')], 'Пароли не совпадают'),
        otherwise: (schema) => schema.optional(),
      }),
  })
}
