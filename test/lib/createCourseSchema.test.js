import { after, before, test } from 'node:test'
import * as assert from 'node:assert'
import { closeDatabase, openDatabase } from '../../lib/db/connection.js'
import { createCourseSchema } from '../../lib/schemas/createCourseSchema.js'

before(async () => {
  await openDatabase(':memory:')
})

after(async () => {
  await closeDatabase()
})

test('createCourseSchema accepts valid data', async () => {
  const data = await createCourseSchema.validate({
    title: 'JS: Объекты',
    description: 'Курс про объекты в JavaScript',
  })

  assert.equal(data.title, 'JS: Объекты')
  assert.equal(data.description, 'Курс про объекты в JavaScript')
})

test('createCourseSchema rejects duplicate title', async () => {
  await assert.rejects(
    () => createCourseSchema.validate({
      title: 'js: массивы',
      description: 'Другое описание курса про массивы',
    }, { abortEarly: false }),
    /уже существует/i
  )
})

test('createCourseSchema rejects short title', async () => {
  await assert.rejects(
    () => createCourseSchema.validate({
      title: 'a',
      description: 'Курс про строки в JavaScript',
    }, { abortEarly: false }),
    /минимум 2 символа/i
  )
})

test('createCourseSchema rejects short description', async () => {
  await assert.rejects(
    () => createCourseSchema.validate({
      title: 'Ruby',
      description: 'коротко',
    }, { abortEarly: false }),
    /минимум 10 символов/i
  )
})

test('createCourseSchema rejects empty fields', async () => {
  try {
    await createCourseSchema.validate({
      title: '',
      description: '',
    }, { abortEarly: false })
    assert.fail('expected validation error')
  } catch (error) {
    assert.equal(error.name, 'ValidationError')
    const messages = error.inner.map((e) => e.message).join(' ')
    assert.match(messages, /Введите название курса/)
    assert.match(messages, /Введите описание курса/)
  }
})
