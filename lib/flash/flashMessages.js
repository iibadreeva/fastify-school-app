/** Типы flash для Bootstrap alert */
export const FLASH_SUCCESS = 'success'
export const FLASH_ERROR = 'error'

const ALERT_CLASS = {
  [FLASH_SUCCESS]: 'alert-success',
  [FLASH_ERROR]: 'alert-danger',
}

/** Записать сообщение в сессию (показывается на следующем запросе или при reply.flash в том же render) */
export function setFlashSuccess (request, message) {
  if (request.session) {
    request.flash(FLASH_SUCCESS, message)
  }
}

export function setFlashError (request, message) {
  if (request.session) {
    request.flash(FLASH_ERROR, message)
  }
}

/**
 * Прочитать и очистить flash из сессии → массив для Pug.
 * @returns {{ type: string, text: string, alertClass: string }[]}
 */
export function getFlashMessages (reply) {
  if (!reply.request.session) {
    return []
  }

  const all = reply.flash() ?? {}
  const messages = []

  for (const [type, texts] of Object.entries(all)) {
    if (!texts?.length) continue

    for (const text of texts) {
      messages.push({
        type,
        text,
        alertClass: ALERT_CLASS[type] ?? 'alert-info',
      })
    }
  }

  return messages
}

/** Для reply.view: свежий flash (422) важнее кэша из preHandler; иначе — locals после redirect */
export function flashMessagesForView (reply) {
  const fresh = getFlashMessages(reply)

  if (fresh.length) {
    return fresh
  }

  return reply.locals?.flashMessages ?? []
}
