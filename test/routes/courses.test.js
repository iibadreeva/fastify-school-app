import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

const COURSE_ARRAYS = 'JS: Массивы'
const COURSE_FUNCTIONS = 'JS: Функции'

test('courses index lists all courses', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.headers['content-type'], /text\/html/)
  assert.match(res.payload, /Курсы по программированию/)
  assert.match(res.payload, new RegExp(COURSE_ARRAYS))
  assert.match(res.payload, new RegExp(COURSE_FUNCTIONS))
  assert.match(res.payload, /Поиск по названию или описанию/)
  assert.match(res.payload, /Новый курс/)
})

test('new course form', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses/new',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, /Новый курс/)
  assert.match(res.payload, /name="title"/)
  assert.match(res.payload, /name="description"/)
})

test('courses search by title', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses?q=массивы',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(COURSE_ARRAYS))
  assert.doesNotMatch(res.payload, new RegExp(COURSE_FUNCTIONS))
})

test('courses search by description', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses?q=JavaScript',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(COURSE_ARRAYS))
  assert.match(res.payload, new RegExp(COURSE_FUNCTIONS))
})

test('courses search is case insensitive', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses?q=МАССИВЫ',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(COURSE_ARRAYS))
  assert.doesNotMatch(res.payload, new RegExp(COURSE_FUNCTIONS))
})

test('courses search trims whitespace', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses?q=%20%20массивы%20%20',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(COURSE_ARRAYS))
  assert.doesNotMatch(res.payload, new RegExp(COURSE_FUNCTIONS))
})

test('courses search with no matches', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses?q=python',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, /Курсы не найдены/)
  assert.doesNotMatch(res.payload, new RegExp(COURSE_ARRAYS))
  assert.doesNotMatch(res.payload, new RegExp(COURSE_FUNCTIONS))
})

test('courses search preserves query in form', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses?q=массивы',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, /name="q"/)
  assert.match(res.payload, /value="массивы"/)
})

test('create course rejects duplicate title', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/courses',
    payload: 'title=js%3A+%D0%BC%D0%B0%D1%81%D1%81%D0%B8%D0%B2%D1%8B&description=Другое+описание+курса+про+массивы+в+JS',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  assert.equal(res.statusCode, 422)
  assert.match(res.payload, /уже существует/)
  assert.match(res.payload, /value="js: массивы"/)
})

test('create course validation errors are shown on form', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/courses',
    payload: 'title=a&description=short',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  assert.equal(res.statusCode, 422)
  assert.match(res.payload, /минимум 2 символа/)
  assert.match(res.payload, /минимум 10 символов/)
  assert.match(res.payload, /value="a"/)
  assert.match(res.payload, /value="short"/)
})

test('create course redirects to courses list', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'POST',
    url: '/courses',
    payload: 'title=Ruby&description=Course+about+Ruby',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  assert.equal(res.statusCode, 302)
  assert.equal(res.headers.location, '/courses')

  const list = await app.inject({
    method: 'GET',
    url: '/courses',
  })

  assert.equal(list.statusCode, 200)
  assert.match(list.payload, /Ruby/)
  assert.match(list.payload, /Course about Ruby/)
})

test('show course page', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses/1',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, new RegExp(COURSE_ARRAYS))
  assert.match(res.payload, /Редактировать/)
})

test('edit course form', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses/1/edit',
  })

  assert.equal(res.statusCode, 200)
  assert.match(res.payload, /Редактирование курса/)
  assert.match(res.payload, /value="PATCH"/)
})

test('patch course updates and redirects to show', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'PATCH',
    url: '/courses/1',
    payload: 'title=Updated+Course&description=Updated+description+for+course+one',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  })

  assert.equal(res.statusCode, 302)
  assert.equal(res.headers.location, '/courses/1')

  const show = await app.inject({ method: 'GET', url: '/courses/1' })
  assert.match(show.payload, /Updated Course/)
  assert.match(show.payload, /Updated description for course one/)
})

test('delete course removes from list', async (t) => {
  const app = await build(t)

  const createRes = await app.inject({
    method: 'POST',
    url: '/courses',
    payload: 'title=Temp+Course&description=Temporary+course+description+here',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  })
  assert.equal(createRes.statusCode, 302)

  const listBefore = await app.inject({ method: 'GET', url: '/courses' })
  assert.match(listBefore.payload, /Temp Course/)

  const idMatch = listBefore.payload.match(/href="\/courses\/(\d+)"[^>]*>\s*Temp Course/)
  assert.ok(idMatch, 'course id not found in list')
  const id = idMatch[1]

  const res = await app.inject({
    method: 'DELETE',
    url: `/courses/${id}`,
  })

  assert.equal(res.statusCode, 302)

  const listAfter = await app.inject({ method: 'GET', url: '/courses' })
  assert.doesNotMatch(listAfter.payload, /Temp Course/)
})

test('courses lesson route', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses/5/lessons/10',
  })

  assert.equal(res.statusCode, 200)
  assert.equal(res.payload, 'Course ID: 5; Post ID: 10')
})
