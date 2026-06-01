import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'
import getUsers from '../../lib/getUsers.js'

const users = getUsers()

test('users index', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/users'
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(users[0].username))
  assert.match(res.payload, new RegExp(users[0].email))
  assert.match(res.payload, /Новый пользователь/)
})

test('new user form', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/users/new',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, /Новый пользователь/)
  assert.match(res.payload, /name="username"/)
  assert.match(res.payload, /name="email"/)
  assert.match(res.payload, /name="password"/)
  assert.match(res.payload, /name="passwordConfirm"/)
})

test('get user', async (t) => {
  const app = await build(t)
  const userIndex = 5

  const res = await app.inject({
    method: 'GET',
    url: `/users/${users[userIndex].id}`
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(users[userIndex].username))
  assert.match(res.payload, new RegExp(users[userIndex].email))
})

test('undefined user', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/users/undefined'
  })

  assert.equal(res.statusCode, 404)
  assert.equal(res.payload, 'User not found')
})

test('create user redirects to users list and normalizes email', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/users',
    payload: 'username=New+User&email=Test%40Example.COM&password=secret&passwordConfirm=secret',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  assert.equal(res.statusCode, 302)
  assert.equal(res.headers.location, '/users')

  const list = await app.inject({
    method: 'GET',
    url: '/users',
  })

  assert.equal(list.statusCode, 200)
  assert.match(list.payload, /New User/)
  assert.match(list.payload, /test@example.com/)
})

test('create user rejects duplicate email', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/users',
    payload: `username=Duplicate&email=${encodeURIComponent(users[0].email.toUpperCase())}&password=secret12&passwordConfirm=secret12`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  assert.equal(res.statusCode, 422)
  assert.match(res.payload, /уже существует/)
  assert.match(res.payload, /value="Duplicate"/)
})

test('edit user form', async (t) => {
  const app = await build(t)
  const user = users[0]

  const res = await app.inject({
    method: 'GET',
    url: `/users/${user.id}/edit`,
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, /Редактирование пользователя/)
  assert.match(res.payload, /name="_method"/)
  assert.match(res.payload, /value="PATCH"/)
  assert.match(res.payload, new RegExp(user.username))
})

test('patch user updates and redirects to show', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/users',
    payload: 'username=Patch+Me&email=patch%40example.com&password=secret12&passwordConfirm=secret12',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  })
  assert.equal(createRes.statusCode, 302)

  const list = await app.inject({ method: 'GET', url: '/users' })
  const idMatch = list.payload.match(/href="\/users\/([0-9a-f-]+)"[^>]*>\s*Patch Me/)
  assert.ok(idMatch, 'user id not found in list')
  const id = idMatch[1]

  const res = await app.inject({
    method: 'PATCH',
    url: `/users/${id}`,
    payload: 'username=Patched+User&email=patched%40example.com',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  })

  assert.equal(res.statusCode, 302)
  assert.equal(res.headers.location, `/users/${id}`)

  const show = await app.inject({ method: 'GET', url: `/users/${id}` })
  assert.match(show.payload, /Patched User/)
  assert.match(show.payload, /patched@example.com/)
})

test('delete user removes from list', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/users',
    payload: 'username=To+Delete&email=delete%40example.com&password=secret12&passwordConfirm=secret12',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  })
  assert.equal(createRes.statusCode, 302)

  const listBefore = await app.inject({ method: 'GET', url: '/users' })
  assert.match(listBefore.payload, /To Delete/)

  const idMatch = listBefore.payload.match(/href="\/users\/([0-9a-f-]+)"[^>]*>\s*To Delete/)
  assert.ok(idMatch, 'user id not found in list')
  const id = idMatch[1]

  const res = await app.inject({
    method: 'DELETE',
    url: `/users/${id}`,
  })

  assert.equal(res.statusCode, 302)
  assert.equal(res.headers.location, '/users')

  const listAfter = await app.inject({ method: 'GET', url: '/users' })
  assert.doesNotMatch(listAfter.payload, /To Delete/)
})

test('show user has edit button', async (t) => {
  const app = await build(t)
  const user = users[0]

  const res = await app.inject({
    method: 'GET',
    url: `/users/${user.id}`,
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, /Редактировать/)
  assert.match(res.payload, /Удалить пользователя/)
})

test('create user validation errors are shown on form', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/users',
    payload: 'username=a&email=bad&password=123&passwordConfirm=456',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  assert.equal(res.statusCode, 422)
  assert.match(res.payload, /Введите корректный email/)
  assert.match(res.payload, /Пароли не совпадают/)
  assert.match(res.payload, /value="a"/)
  assert.match(res.payload, /value="bad"/)
})
