// This file contains code that we reuse
// between our tests.

import helper from 'fastify-cli/helper.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AppPath = path.join(__dirname, '..', 'app.js')

// Fill in this config with all the configurations
// needed for testing the application
function config () {
  process.env.DATABASE_PATH = ':memory:'

  return {
    skipOverride: true // Register our application with fastify-plugin
  }
}

// automatically build and tear down our instance
async function build (t) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath]

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await helper.build(argv, config())

  // tear down our app after we are done
  t.after(() => app.close())

  return app
}

const formHeaders = { 'content-type': 'application/x-www-form-urlencoded' }

/** Одна строка Cookie из Set-Cookie (массив или строка) */
export function sessionCookieFromResponse (res) {
  const header = res.headers['set-cookie']
  if (!header) return ''
  return mergeCookieHeaders(header)
}

/** Склеить несколько Set-Cookie / Cookie в один заголовок для inject */
export function mergeCookieHeaders (...headers) {
  const parts = []

  for (const header of headers) {
    if (!header) continue
    const items = Array.isArray(header) ? header : [header]

    for (const item of items) {
      const nameValue = item.split(';')[0].trim()
      if (nameValue) parts.push(nameValue)
    }
  }

  const seen = new Set()
  return parts.filter((p) => {
    const name = p.split('=')[0]
    if (seen.has(name)) return false
    seen.add(name)
    return true
  }).join('; ')
}

/** Найти id пользователя по имени на страницах списка /users */
export async function findUserIdInList (app, username, { cookie } = {}) {
  const displayName = username.replace(/\+/g, ' ')
  const escaped = displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`href="/users/([0-9a-f-]+)"[^>]*>\\s*${escaped}`)

  for (let page = 1; page <= 20; page++) {
    const res = await app.inject({
      method: 'GET',
      url: `/users?page=${page}`,
      headers: cookie ? { cookie } : undefined,
    })

    const idMatch = res.payload.match(pattern)
    if (idMatch) {
      return idMatch[1]
    }

    const totalMatch = res.payload.match(/Страница \d+ из (\d+)/)
    if (totalMatch && page >= Number(totalMatch[1])) {
      break
    }
  }

  return null
}

export async function createAuthenticatedSession (app, overrides = {}) {
  const email = overrides.email ?? `test-${Date.now()}@example.com`
  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: overrides.username ?? 'Test Auth',
      email,
      password: overrides.password ?? 'secret12',
      passwordConfirm: overrides.passwordConfirm ?? 'secret12',
    }).toString(),
  })

  if (res.statusCode !== 302) {
    throw new Error(`register failed: ${res.statusCode} ${res.payload}`)
  }

  return sessionCookieFromResponse(res)
}

export {
  config,
  build,
  formHeaders,
}
