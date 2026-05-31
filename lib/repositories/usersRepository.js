import { randomUUID } from 'node:crypto'
import getUsers from '../getUsers.js'
import hashPassword from '../hashPassword.js'
import normalizeEmail from '../normalizeEmail.js'

const users = getUsers()

export function getAllUsers () {
  return users
}

export function findUserById (id) {
  return users.find((user) => user.id === id)
}

export function createUser ({ username, email, password }) {
  const user = {
    id: randomUUID(),
    username: username.trim(),
    email: normalizeEmail(email),
    password: hashPassword(password),
  }

  users.push(user)

  return user
}
