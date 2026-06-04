import { test } from 'node:test'
import * as assert from 'node:assert'
import { build, mergeCookieHeaders, sessionCookieFromResponse } from '../helper.js'

const formHeaders = { 'content-type': 'application/x-www-form-urlencoded' }

test('register sets session cookie behind HTTPS proxy in production', async (t) => {
  const prevNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => {
    if (prevNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = prevNodeEnv
    }
  })

  const app = await build(t)
  const email = `proxy-${Date.now()}@example.com`

  const register = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: {
      ...formHeaders,
      'x-forwarded-proto': 'https',
    },
    payload: new URLSearchParams({
      username: 'Proxy User',
      email,
      password: 'secret12',
      passwordConfirm: 'secret12',
    }).toString(),
  })

  assert.equal(register.statusCode, 302)

  const sessionCookie = sessionCookieFromResponse(register)
  assert.ok(sessionCookie, 'expected Set-Cookie after register in production')
  assert.match(sessionCookie, /sessionId=/)

  const profile = await app.inject({
    url: '/auth/profile',
    headers: {
      cookie: sessionCookie,
      'x-forwarded-proto': 'https',
    },
  })

  assert.equal(profile.statusCode, 200)
  assert.match(profile.payload, /Proxy User/)
})

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
    headers: { cookie: sessionCookieFromResponse(register) },
  })

  assert.equal(profile.statusCode, 200)
  assert.match(profile.payload, /Auth User/)
  assert.match(profile.payload, new RegExp(email.replace('.', '\\.')))
  assert.match(profile.payload, /alert-success/)
  assert.match(profile.payload, /Аккаунт создан/)
})

test('register validation shows flash error', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: 'a',
      email: 'bad',
      password: '123',
      passwordConfirm: '456',
    }).toString(),
  })

  assert.equal(res.statusCode, 422)
  assert.match(res.payload, /alert-danger/)
  assert.match(res.payload, /Не удалось зарегистрироваться/)
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
  assert.match(login.payload, /alert-danger/)
  assert.match(login.payload, /Неверный email или пароль/)
})

test('login success shows flash on profile', async (t) => {
  const app = await build(t)
  const email = `login-ok-${Date.now()}@example.com`
  const password = 'secret12'

  const register = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: 'Login Ok',
      email,
      password,
      passwordConfirm: password,
    }).toString(),
  })

  await app.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { cookie: sessionCookieFromResponse(register) },
  })

  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: formHeaders,
    payload: new URLSearchParams({ email, password }).toString(),
  })

  assert.equal(login.statusCode, 302)

  const profile = await app.inject({
    url: '/auth/profile',
    headers: { cookie: sessionCookieFromResponse(login) },
  })

  assert.match(profile.payload, /alert-success/)
  assert.match(profile.payload, /Вы успешно вошли/)
})

test('logout clears auth and shows flash on home', async (t) => {
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

  const sessionCookie = sessionCookieFromResponse(register)

  const logout = await app.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { cookie: sessionCookie },
  })

  assert.equal(logout.statusCode, 302)
  assert.equal(logout.headers.location, '/')

  const home = await app.inject({
    url: '/',
    headers: { cookie: mergeCookieHeaders(sessionCookie, logout.headers['set-cookie']) },
  })

  assert.match(home.payload, /alert-success/)
  assert.match(home.payload, /Вы вышли из системы/)
  assert.match(home.payload, /Вход/)

  const profile = await app.inject({
    url: '/auth/profile',
    headers: { cookie: mergeCookieHeaders(sessionCookie, logout.headers['set-cookie']) },
  })

  assert.equal(profile.statusCode, 302)
  assert.equal(profile.headers.location, '/auth/login')
})

test('guest redirect to login can show flash when session exists', async (t) => {
  const app = await build(t)
  const email = `guest-${Date.now()}@example.com`

  const register = await app.inject({
    method: 'POST',
    url: '/auth/register',
    headers: formHeaders,
    payload: new URLSearchParams({
      username: 'Guest Flash',
      email,
      password: 'secret12',
      passwordConfirm: 'secret12',
    }).toString(),
  })

  const cookie = sessionCookieFromResponse(register)

  await app.inject({
    method: 'POST',
    url: '/auth/logout',
    headers: { cookie },
  })

  await app.inject({
    method: 'GET',
    url: '/users/new',
    headers: { cookie },
  })

  const login = await app.inject({
    url: '/auth/login',
    headers: { cookie },
  })

  assert.match(login.payload, /alert-danger/)
  assert.match(login.payload, /Войдите, чтобы продолжить/)
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
    headers: { cookie: sessionCookieFromResponse(register) },
  })

  assert.match(home.payload, /Header User/)
  assert.match(home.payload, /Выход/)
  assert.doesNotMatch(home.payload, /href="\/auth\/register"/)
})
