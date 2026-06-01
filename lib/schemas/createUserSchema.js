import * as yup from 'yup'

/**
 * Схема валидации формы создания пользователя (POST /users).
 * Сообщения об ошибках отображаются в views/users/new.pug.
 *
 * @see https://github.com/jquense/yup
 */
export const createUserSchema = yup.object({
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
    .email('Введите корректный email'),
  password: yup
    .string()
    .required('Введите пароль')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  // yup.ref('password') — сравнение с полем password в том же объекте
  passwordConfirm: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),
})
