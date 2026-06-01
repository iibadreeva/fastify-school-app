/**
 * Нормализует email: Test@Example.COM → test@example.com
 */
export default function normalizeEmail (email) {
  return email.trim().toLowerCase()
}
