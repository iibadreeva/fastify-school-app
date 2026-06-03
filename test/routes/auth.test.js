import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

const formHeaders = { 'content-type': 'application/x-www-form-urlencoded' }

function cookieFromResponse (res) {
  const header = res.headers['set-cookie']
  if (!header) return ''
  return Array.isArray(header) ? header.join('; ') : header
}

test('register logs in and opens profile', async (t) => {
  const app = await build(t)
  const email = `auth-${Date.now()}@example.com`

  const register = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: 'Auth User',
      email,
      password: 'secret12',
      passwordConfirm: 'secret12',
    }).toString(),
  })

  assert.equal(register.statusCode, 302)
  assert.equal(register.headers.location, '/auth/profile')

  const profile = await app.inject({
    url: '/auth/profile',
    headers: { cookie: cookieFromResponse(register) },
  })

  assert.equal(profile.statusCode, 200)
  assert.match(profile.payload, /Auth User/)
  assert.match(profile.payload, new RegExp(email.replace('.', '\\.')))
})

test('login rejects wrong password', async (t) => {
  const app = await build(t)
  const email = `login-${Date.now()}@example.com`

  await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: 'Login Test',
      email,
      password: 'secret12',
      passwordConfirm: 'secret12',
    }).toString(),
  })

  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: formHeaders,
    payload: new URLSearchParams({
      email,
      password: 'wrong-password',
    }).toString(),
  })

  assert.equal(login.statusCode, 422)
  assert.match(login.payload, /Неверный email или пароль/)
})

test('logout destroys session', async (t) => {
  const app = await build(t)
  const email = `logout-${Date.now()}@example.com`

  const register = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: 'Logout User',
      email,
      password: 'secret12',
      passwordConfirm: 'secret12',
    }).toString(),
  })

  const sessionCookie = cookieFromResponse(register)

  const logout = await app.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { cookie: sessionCookie },
  })

  assert.equal(logout.statusCode, 302)
  assert.equal(logout.headers.location, '/')

  const profile = await app.inject({
    url: '/auth/profile',
    headers: { cookie: cookieFromResponse(logout) || sessionCookie },
  })

  assert.equal(profile.statusCode, 302)
  assert.equal(profile.headers.location, '/auth/login')
})

test('header shows login links for guest and profile for authenticated user', async (t) => {
  const app = await build(t)

  const guest = await app.inject({ url: '/' })
  assert.match(guest.payload, /Вход/)
  assert.match(guest.payload, /Регистрация/)
  assert.doesNotMatch(guest.payload, /Logout User/)

  const email = `header-${Date.now()}@example.com`
  const register = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: 'Header User',
      email,
      password: 'secret12',
      passwordConfirm: 'secret12',
    }).toString(),
  })

  const home = await app.inject({
    url: '/',
    headers: { cookie: cookieFromResponse(register) },
  })

  assert.match(home.payload, /Header User/)
  assert.match(home.payload, /Выход/)
  assert.doesNotMatch(home.payload, /href="\/auth\/register"/)
})
