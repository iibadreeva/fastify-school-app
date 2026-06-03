import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'
import getUsers from '../getUsers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQL_WASM_DIR = path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist')

/** @type {{ db: import('sql.js').Database, run: Function, get: Function, all: Function, exec: Function, path: string, persist: Function } | null} */
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

function persistDatabase () {
  if (!store || store.path === ':memory:') {
    return
  }

  const data = store.db.export()
  fs.writeFileSync(store.path, Buffer.from(data))
}

function createRun (db, persist) {
  return async function run (sql, params = []) {
    db.run(sql, params)
    persist()

    const lastIdRow = db.exec('SELECT last_insert_rowid() AS lastID')
    const lastID = lastIdRow[0]?.values[0]?.[0] ?? 0

    return {
      lastID,
      changes: db.getRowsModified(),
    }
  }
}

function createGet (db) {
  return async function get (sql, params = []) {
    const stmt = db.prepare(sql)
    stmt.bind(params)

    if (stmt.step()) {
      const row = stmt.getAsObject()
      stmt.free()
      return row
    }

    stmt.free()
    return undefined
  }
}

function createAll (db) {
  return async function all (sql, params = []) {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows = []

    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }

    stmt.free()
    return rows
  }
}

function createExec (db, persist) {
  return async function exec (sql) {
    db.exec(sql)
    persist()
  }
}

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
 * Открыть SQLite (sql.js / WASM — без native-модулей, работает на Render).
 * @param {string} [dbPath]
 */
export async function openDatabase (dbPath = getDefaultDatabasePath()) {
  if (store) {
    await closeDatabase()
  }

  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(SQL_WASM_DIR, file),
  })

  let db

  if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath))
  } else {
    db = new SQL.Database()
  }

  const persist = () => persistDatabase()
  const run = createRun(db, persist)
  const get = createGet(db)
  const all = createAll(db)
  const exec = createExec(db, persist)

  store = { db, run, get, all, exec, path: dbPath, persist }

  await exec(SCHEMA)
  await seedIfEmpty()
  persist()

  return store
}

export async function closeDatabase () {
  if (!store) {
    return
  }

  store.persist()
  store.db.close()
  store = null
}
