import { randomUUID } from 'node:crypto'
import getUsers from '../getUsers.js'
import hashPassword from '../hashPassword.js'
import normalizeEmail from '../normalizeEmail.js'

// In-memory хранилище: один массив на всё приложение
const users = getUsers()

const USERS_PER_PAGE = 10

export function getAllUsers () {
  return users
}

/**
 * Страница списка пользователей (нумерация с 1).
 * @returns {{ users, page, totalPages, total, hasPrev, hasNext }}
 */
export function getUsersPage (page = 1, pageSize = USERS_PER_PAGE) {
  const total = users.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    users: users.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

export function findUserById (id) {
  return users.find((user) => user.id === id)
}

/** Поиск по нормализованному email (вход, регистрация) */
export function findUserByEmail (email) {
  const normalized = normalizeEmail(email)
  return users.find((user) => normalizeEmail(user.email) === normalized) ?? null
}

/** @param {string|null} excludeUserId — при редактировании не считать email текущего пользователя занятым */
export function isEmailTaken (email, excludeUserId = null) {
  const normalized = normalizeEmail(email)
  return users.some(
    (user) => user.id !== excludeUserId && normalizeEmail(user.email) === normalized
  )
}

/** @returns {object|null} обновлённый пользователь или null, если id не найден */
export function updateUser (id, { username, email, password }) {
  const user = findUserById(id)

  if (!user) {
    return null
  }

  user.username = username.trim()
  user.email = normalizeEmail(email)

  if (password) {
    user.password = hashPassword(password)
  }

  return user
}

/** @returns {boolean} true, если запись удалена */
export function deleteUser (id) {
  const index = users.findIndex((user) => user.id === id)

  if (index === -1) {
    return false
  }

  users.splice(index, 1)
  return true
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
