import { randomUUID } from 'node:crypto'
import getUsers from '../getUsers.js'
import hashPassword from '../hashPassword.js'
import normalizeEmail from '../normalizeEmail.js'

// In-memory хранилище: один массив на всё приложение
const users = getUsers()

export function getAllUsers () {
  return users
}

export function findUserById (id) {
  return users.find((user) => user.id === id)
}

export function isEmailTaken (email) {
  const normalized = normalizeEmail(email)
  return users.some((user) => normalizeEmail(user.email) === normalized)
}

export function createUser ({ username, email, password }) {
  // username уже проверен и обрезан Yup-схемой; email и password — здесь
  const user = {
    id: randomUUID(),
    username: username.trim(),
    email: normalizeEmail(email),
    password: hashPassword(password),
  }

  users.push(user)

  return user
}
