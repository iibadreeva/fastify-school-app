import { getDb } from '../db/connection.js'

function mapCourse (row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
  }
}

export async function getAllCourses () {
  const { all } = getDb()
  const rows = await all(
    'SELECT id, title, description FROM courses ORDER BY id ASC'
  )

  return rows.map(mapCourse)
}

export async function findCourseById (id) {
  const numericId = Number(id)
  const { get } = getDb()
  const row = await get(
    'SELECT id, title, description FROM courses WHERE id = ?',
    [numericId]
  )

  return mapCourse(row)
}

/** @param {number|null} excludeCourseId */
export async function isCourseTitleTaken (title, excludeCourseId = null) {
  const normalized = title.trim().toLowerCase()
  const { all } = getDb()
  const rows = await all('SELECT id, title FROM courses')

  return rows.some(
    (row) =>
      row.id !== excludeCourseId
      && row.title.trim().toLowerCase() === normalized
  )
}

/** @returns {Promise<object|null>} */
export async function updateCourse (id, { title, description }) {
  const course = await findCourseById(id)

  if (!course) {
    return null
  }

  const { run } = getDb()
  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()

  await run(
    `UPDATE courses SET title = ?, description = ? WHERE id = ?`,
    [trimmedTitle, trimmedDescription, course.id]
  )

  course.title = trimmedTitle
  course.description = trimmedDescription

  return course
}

/** @returns {Promise<boolean>} */
export async function deleteCourse (id) {
  const { run } = getDb()
  const { changes } = await run('DELETE FROM courses WHERE id = ?', [Number(id)])

  return changes > 0
}

export async function createCourse ({ title, description }) {
  const { run } = getDb()
  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const { lastID } = await run(
    `INSERT INTO courses (title, description) VALUES (?, ?)`,
    [trimmedTitle, trimmedDescription]
  )

  return {
    id: lastID,
    title: trimmedTitle,
    description: trimmedDescription,
  }
}
