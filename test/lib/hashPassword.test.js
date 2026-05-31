import { test } from 'node:test'
import * as assert from 'node:assert'
import hashPassword from '../../lib/hashPassword.js'

test('hashPassword returns sha256 hash', () => {
  const hash = hashPassword('secret')

  assert.match(hash, /^[a-f0-9]{64}$/)
  assert.equal(hash, hashPassword('secret'))
  assert.notEqual(hash, hashPassword('other'))
})
