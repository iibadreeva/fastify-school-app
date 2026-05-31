import { test } from 'node:test'
import * as assert from 'node:assert'
import normalizeEmail from '../../lib/normalizeEmail.js'

test('normalizeEmail trims and lowercases email', () => {
  assert.equal(normalizeEmail('  Test@Example.COM  '), 'test@example.com')
})
