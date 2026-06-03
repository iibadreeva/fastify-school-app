import { randomUUID } from 'node:crypto'
import { getDb } from '../db/connection.js'
import hashPassword from '../hashPassword.js'
import normalizeEmail from '../normalizeEmail.js'

const USERS_PER_PAGE = 10

function mapUser (row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
  }
}

export async function getAllUsers () {
  const { all } = getDb()
  const rows = await all(
    'SELECT id, username, email, password FROM users ORDER BY rowid ASC'
  )

  return rows.map(mapUser)
}

/**
 * Страница списка пользователей (нумерация с 1).
 * @returns {Promise<{ users, page, totalPages, total, hasPrev, hasNext }>}
 */
export async function getUsersPage (page = 1, pageSize = USERS_PER_PAGE) {
  const { get, all } = getDb()
  const countRow = await get('SELECT COUNT(*) AS count FROM users')
  const total = countRow.count
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const offset = (safePage - 1) * pageSize

  const rows = await all(
    `SELECT id, username, email, password FROM users
     ORDER BY rowid ASC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  )

  return {
    users: rows.map(mapUser),
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

export async function findUserById (id) {
  const { get } = getDb()
  const row = await get(
    'SELECT id, username, email, password FROM users WHERE id = ?',
    [id]
  )

  return mapUser(row)
}

/** Поиск по нормализованному email (вход, регистрация) */
export async function findUserByEmail (email) {
  const normalized = normalizeEmail(email)
  const { get } = getDb()
  const row = await get(
    `SELECT id, username, email, password FROM users
     WHERE lower(trim(email)) = ?`,
    [normalized]
  )

  return mapUser(row)
}

/** @param {string|null} excludeUserId */
export async function isEmailTaken (email, excludeUserId = null) {
  const normalized = normalizeEmail(email)
  const { get } = getDb()
  const row = await get(
    `SELECT id FROM users
     WHERE lower(trim(email)) = ? AND id != coalesce(?, '')`,
    [normalized, excludeUserId ?? '']
  )

  return Boolean(row)
}

/** @returns {Promise<object|null>} */
export async function updateUser (id, { username, email, password }) {
  const user = await findUserById(id)

  if (!user) {
    return null
  }

  const { run } = getDb()
  const normalizedEmail = normalizeEmail(email)

  if (password) {
    const hashed = hashPassword(password)
    await run(
      `UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?`,
      [username.trim(), normalizedEmail, hashed, id]
    )
    user.password = hashed
  } else {
    await run(
      `UPDATE users SET username = ?, email = ? WHERE id = ?`,
      [username.trim(), normalizedEmail, id]
    )
  }

  user.username = username.trim()
  user.email = normalizedEmail

  return user
}

/** @returns {Promise<boolean>} */
export async function deleteUser (id) {
  const { run } = getDb()
  const { changes } = await run('DELETE FROM users WHERE id = ?', [id])

  return changes > 0
}

export async function createUser ({ username, email, password }) {
  const { run } = getDb()
  const user = {
    id: randomUUID(),
    username: username.trim(),
    email: normalizeEmail(email),
    password: hashPassword(password),
  }

  await run(
    `INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)`,
    [user.id, user.username, user.email, user.password]
  )

  return user
}
