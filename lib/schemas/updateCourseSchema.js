import * as yup from 'yup'
import { isCourseTitleTaken } from '../repositories/coursesRepository.js'

/**
 * Схема PATCH /courses/:id (форма views/courses/edit.pug).
 *
 * @param {number} courseId — текущий курс исключается из проверки уникальности title
 */
export function createUpdateCourseSchema (courseId) {
  return yup.object({
    title: yup
      .string()
      .trim()
      .required('Введите название курса')
      .min(2, 'Название курса должно содержать минимум 2 символа')
      .max(50, 'Название курса не должно превышать 50 символов')
      .test(
        'unique-title',
        'Курс с таким названием уже существует',
        (value) => !value || !isCourseTitleTaken(value, courseId)
      ),
    description: yup
      .string()
      .trim()
      .required('Введите описание курса')
      .min(10, 'Описание курса должно содержать минимум 10 символов')
      .max(500, 'Описание курса не должно превышать 500 символов'),
  })
}
