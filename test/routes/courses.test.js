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

test('courses lesson route', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    method: 'GET',
    url: '/courses/5/lessons/10',
  })

  assert.equal(res.statusCode, 200)
  assert.equal(res.payload, 'Course ID: 5; Post ID: 10')
})
