import CryptoJS from 'crypto-js'

/**
 * Хеширует пароль перед сохранением в репозиторий.
 * В учебном проекте используется SHA-256, не для production.
 */
export default function hashPassword (password) {
  return CryptoJS.SHA256(password).toString()
}
