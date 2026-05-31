import CryptoJS from 'crypto-js'

export default function hashPassword (password) {
  return CryptoJS.SHA256(password).toString()
}
