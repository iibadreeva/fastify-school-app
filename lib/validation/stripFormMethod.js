/**
 * Эмуляция PATCH и DELETE в HTML-формах.
 *
 * Браузер умеет только GET и POST. В шаблонах:
 *   form(method="POST" action="/users/123")
 *     input(type="hidden" name="_method" value="PATCH")
 *
 * Обработчик POST /:id читает _method и вызывает ту же логику, что PATCH или DELETE.
 * Поле _method удаляется из body, чтобы не мешать Yup-валидации.
 *
 * @returns {'PATCH'|'DELETE'|null} null — если override не задан
 */
export function consumeFormMethodOverride (body) {
  if (!body || body._method == null) {
    return null
  }

  const method = String(body._method).toUpperCase()
  delete body._method

  if (method === 'PATCH' || method === 'DELETE') {
    return method
  }

  return null
}
