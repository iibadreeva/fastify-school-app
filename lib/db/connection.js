import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sqlite3 from 'sqlite3'
import getUsers from '../getUsers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {{ db: import('sqlite3').Database, run: Function, get: Function, all: Function, exec: Function } | null} */
let store = null

export function getDb () {
  if (!store) {
    throw new Error('Database is not initialized. Register plugins/database.js first.')
  }

  return store
}

export function getDefaultDatabasePath () {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH
  }

  if (process.env.NODE_ENV === 'test') {
    return ':memory:'
  }

  return path.join(__dirname, '..', '..', 'data', 'app.sqlite')
}

const SQLITE_BUSY = 'SQLITE_BUSY'

function createRun (db) {
  return async function run (sql, params = [], attempt = 0) {
    try {
      return await new Promise((resolve, reject) => {
        db.run(sql, params, function onRun (err) {
          if (err) {
            reject(err)
          } else {
            resolve({ lastID: this.lastID, changes: this.changes })
          }
        })
      })
    } catch (err) {
      if (err.code === SQLITE_BUSY && attempt < 5) {
        await new Promise((r) => setTimeout(r, 50 * (attempt + 1)))
        return run(sql, params, attempt + 1)
      }

      throw err
    }
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_normalized
  ON users (lower(trim(email)));

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);
`

const SEED_COURSES = [
  { id: 1, title: 'JS: Массивы', description: 'Курс про массивы в JavaScript' },
  { id: 2, title: 'JS: Функции', description: 'Курс про функции в JavaScript' },
]

async function seedUsers (run) {
  const users = getUsers()

  for (const user of users) {
    await run(
      `INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)`,
      [user.id, user.username, user.email, user.password]
    )
  }
}

async function seedCourses (run) {
  for (const course of SEED_COURSES) {
    await run(
      `INSERT INTO courses (id, title, description) VALUES (?, ?, ?)`,
      [course.id, course.title, course.description]
    )
  }
}

async function seedIfEmpty () {
  const { get, run } = store
  const row = await get('SELECT COUNT(*) AS count FROM users')

  if (row.count > 0) {
    return
  }

  await seedUsers(run)
  await seedCourses(run)
}

/**
 * Открыть SQLite и применить схему. Для пустой БД — начальные пользователи и курсы.
 * @param {string} [dbPath]
 */
export async function openDatabase (dbPath = getDefaultDatabasePath()) {
  if (store) {
    await closeDatabase()
  }

  // создаем базу данных в памяти с помощью параметра ':memory:'.
  // База данных в памяти — это значит, что база данных будет существовать только в операционной памяти компьютера пока работает сервер
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }

  const db = new sqlite3.Database(dbPath)
  const run = createRun(db)
  const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  })
  const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  })
  const exec = (sql) => new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()))
  })

  store = { db, run, get, all, exec, path: dbPath }
  await exec(SCHEMA)
  await exec('PRAGMA journal_mode = WAL')
  await exec('PRAGMA busy_timeout = 5000')
  await seedIfEmpty()

  return store
}

export async function closeDatabase () {
  if (!store) {
    return
  }

  await new Promise((resolve, reject) => {
    store.db.close((err) => (err ? reject(err) : resolve()))
  })
  store = null
}
