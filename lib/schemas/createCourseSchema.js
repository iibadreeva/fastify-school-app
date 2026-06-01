import * as yup from 'yup'

/**
 * Схема валидации формы создания курса (POST /courses).
 * Сообщения об ошибках отображаются в views/courses/new.pug.
 *
 * @see https://github.com/jquense/yup
 */
export const createCourseSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Введите название курса')
    .min(2, 'Название курса должно содержать минимум 2 символа')
    .max(50, 'Название курса не должно превышать 50 символов'),
  description: yup
    .string()
    .trim()
    .required('Введите описание курса')
    .min(10, 'Описание курса должно содержать минимум 10 символов')
    .max(500, 'Описание курса не должно превышать 500 символов'),
})
