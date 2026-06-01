const courses = [
  {
    id: 1,
    title: 'JS: Массивы',
    description: 'Курс про массивы в JavaScript',
  },
  {
    id: 2,
    title: 'JS: Функции',
    description: 'Курс про функции в JavaScript',
  },
]

let nextId = courses.length + 1

export function getAllCourses () {
  return courses
}

export function findCourseById (id) {
  // id из URL — строка; в массиве courses.id — число
  const numericId = Number(id)
  return courses.find((course) => course.id === numericId)
}

/** @param {number|null} excludeCourseId — при редактировании исключить текущий курс */
export function isCourseTitleTaken (title, excludeCourseId = null) {
  const normalized = title.trim().toLowerCase()
  return courses.some(
    (course) =>
      course.id !== excludeCourseId
      && course.title.trim().toLowerCase() === normalized
  )
}

/** @returns {object|null} */
export function updateCourse (id, { title, description }) {
  const course = findCourseById(id)

  if (!course) {
    return null
  }

  course.title = title.trim()
  course.description = description.trim()

  return course
}

/** @returns {boolean} */
export function deleteCourse (id) {
  const index = courses.findIndex((course) => course.id === Number(id))

  if (index === -1) {
    return false
  }

  courses.splice(index, 1)
  return true
}

export function createCourse ({ title, description }) {
  const course = {
    id: nextId++,
    title: title.trim(),
    description: description.trim(),
  }

  courses.push(course)

  return course
}
