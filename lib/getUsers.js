import { faker } from '@faker-js/faker'
import hashPassword from './hashPassword.js'

const createRandomUser = () => ({
  id: faker.string.uuid(),
  username: faker.internet.username(),
  email: faker.internet.email(),
  password: hashPassword(faker.internet.password()),
})

export default function getUsers () {
  faker.seed(123) // фиксированный seed — одинаковые данные при каждом запуске
  return faker.helpers.multiple(createRandomUser, {
    count: 10,
  })
}
