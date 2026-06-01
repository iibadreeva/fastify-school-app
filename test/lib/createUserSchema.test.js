import { test } from 'node:test'
import * as assert from 'node:assert'
import getUsers from '../../lib/getUsers.js'
import { createUserSchema } from '../../lib/schemas/createUserSchema.js'

const existingEmail = getUsers()[0].email

test('createUserSchema accepts valid data', async () => {
  const data = await createUserSchema.validate({
    username: 'alice',
    email: 'alice@example.com',
    password: 'secret',
    passwordConfirm: 'secret',
  })

  assert.equal(data.username, 'alice')
  assert.equal(data.email, 'alice@example.com')
})

test('createUserSchema rejects invalid email', async () => {
  await assert.rejects(
    () => createUserSchema.validate({
      username: 'alice',
      email: 'not-an-email',
      password: 'secret',
      passwordConfirm: 'secret',
    }, { abortEarly: false }),
    /корректный email/i
  )
})

test('createUserSchema rejects duplicate email', async () => {
  await assert.rejects(
    () => createUserSchema.validate({
      username: 'another',
      email: existingEmail.toUpperCase(),
      password: 'secret12',
      passwordConfirm: 'secret12',
    }, { abortEarly: false }),
    /уже существует/i
  )
})

test('createUserSchema rejects password mismatch', async () => {
  await assert.rejects(
    () => createUserSchema.validate({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret',
      passwordConfirm: 'other',
    }, { abortEarly: false }),
    /не совпадают/i
  )
})
