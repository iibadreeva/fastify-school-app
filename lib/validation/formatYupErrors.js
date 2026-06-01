/**
 * Преобразует ValidationError Yup в объект { fieldName: message }
 * для передачи в Pug-шаблон (errors.username, errors.email и т.д.).
 */
export function formatYupErrors (validationError) {
  const errors = {}

  // inner содержит все ошибки при abortEarly: false
  for (const error of validationError.inner) {
    // берём только первое сообщение для каждого поля
    if (!errors[error.path]) {
      errors[error.path] = error.message
    }
  }

  return errors
}
