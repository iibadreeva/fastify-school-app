/**
 * Имена маршрутов для fastify.reverse (см. plugins/reverse-routes.js).
 * URL задаёт autoload по имени папки: routes/users → /users, routes/courses → /courses.
 *
 * Использование: reverse(RouteNames.EDIT_USER, { id: user.id }) → "/users/{id}/edit"
 */
export class RouteNames {
  static HOME = 'home'

  // --- Пользователи (/users) ---
  static USERS_INDEX = 'usersIndex'       // GET  /
  static NEW_USER = 'newUser'             // GET  /new
  static CREATE_USER = 'createUser'       // POST /
  static SHOW_USER = 'showUser'           // GET  /:id
  static EDIT_USER = 'editUser'           // GET  /:id/edit
  static UPDATE_USER = 'updateUser'       // PATCH /:id
  static DELETE_USER = 'deleteUser'       // DELETE /:id

  // --- Курсы (/courses) ---
  static COURSES_INDEX = 'coursesIndex'   // GET  /
  static NEW_COURSE = 'newCourse'         // GET  /new
  static CREATE_COURSE = 'createCourse'   // POST /
  static SHOW_COURSE = 'showCourse'       // GET  /:id
  static EDIT_COURSE = 'editCourse'       // GET  /:id/edit
  static UPDATE_COURSE = 'updateCourse'   // PATCH /:id
  static DELETE_COURSE = 'deleteCourse'   // DELETE /:id
  static COURSE_LESSON = 'courseLesson'   // GET  /:id/lessons/:postId

  // --- Аутентификация (/auth) ---
  static AUTH_LOGIN = 'authLogin'           // GET  /login
  static AUTH_LOGIN_POST = 'authLoginPost' // POST /login
  static AUTH_REGISTER = 'authRegister'     // GET  /register
  static AUTH_REGISTER_POST = 'authRegisterPost' // POST /register
  static AUTH_LOGOUT = 'authLogout'         // POST /logout
  static AUTH_PROFILE = 'authProfile'       // GET  /profile

  static DEMO = 'demo'
  static TEST = 'test'
}
