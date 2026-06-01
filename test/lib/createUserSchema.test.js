import { test } from 'node:test'
import * as assert from 'node:assert'
import { createUserSchema } from '../../lib/schemas/createUserSchema.js'

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
