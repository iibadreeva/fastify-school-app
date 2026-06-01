/**
 * Имена маршрутов для fastify-reverse-routes (fastify.reverse).
 * URL задаются префиксами autoload: routes/users → /users, routes/courses → /courses.
 */
export class RouteNames {
  static HOME = 'home'

  static USERS_INDEX = 'usersIndex'
  static NEW_USER = 'newUser'
  static CREATE_USER = 'createUser'
  static SHOW_USER = 'showUser'

  static COURSES_INDEX = 'coursesIndex'
  static NEW_COURSE = 'newCourse'
  static CREATE_COURSE = 'createCourse'
  static COURSE_LESSON = 'courseLesson'

  static DEMO = 'demo'
  static TEST = 'test'
}
