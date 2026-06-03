import { RouteNames } from '../../lib/RouteNames.js'
import * as authController from '../../lib/controllers/authController.js'

/**
 * Вход, регистрация, профиль и выход (/auth).
 * Состояние «кто залогинен» хранится в @fastify/session (см. plugins/session.js).
 */
export default async function (fastify, opts) {
  fastify.get('/login', { name: RouteNames.AUTH_LOGIN }, authController.loginForm)
  fastify.post('/login', { name: RouteNames.AUTH_LOGIN_POST }, authController.login)

  fastify.get('/register', { name: RouteNames.AUTH_REGISTER }, authController.registerForm)
  fastify.post('/register', { name: RouteNames.AUTH_REGISTER_POST }, authController.register)

  fastify.post('/logout', { name: RouteNames.AUTH_LOGOUT }, authController.logout)

  fastify.get('/profile', { name: RouteNames.AUTH_PROFILE }, authController.profile)
}
