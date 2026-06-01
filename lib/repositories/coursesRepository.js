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

export function isCourseTitleTaken (title) {
  const normalized = title.trim().toLowerCase()
  return courses.some(
    (course) => course.title.trim().toLowerCase() === normalized
  )
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
