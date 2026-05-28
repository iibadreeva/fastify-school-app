import { faker } from '@faker-js/faker'

const createRandomUser = () => ({
  id: faker.string.uuid(),
  username: faker.internet.username(),
  email: faker.internet.email()
})

export default function getUsers () {
  faker.seed(123)
  return faker.helpers.multiple(createRandomUser, {
    count: 100
  })
}
