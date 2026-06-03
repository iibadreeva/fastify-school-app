import hashPassword from './hashPassword.js'

/** Сравнивает пароль из формы с хешем из репозитория */
export default function verifyPassword (plainPassword, passwordHash) {
  return hashPassword(plainPassword) === passwordHash
}
