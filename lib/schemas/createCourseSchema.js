import * as yup from 'yup'
import { isCourseTitleTaken } from '../repositories/coursesRepository.js'

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
    .max(50, 'Название курса не должно превышать 50 символов')
    .test(
      'unique-title',
      'Курс с таким названием уже существует',
      (value) => !value || !isCourseTitleTaken(value)
    ),
  description: yup
    .string()
    .trim()
    .required('Введите описание курса')
    .min(10, 'Описание курса должно содержать минимум 10 символов')
    .max(500, 'Описание курса не должно превышать 500 символов'),
})
