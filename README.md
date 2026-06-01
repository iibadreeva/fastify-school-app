# fastify-school-app

Веб-приложение на [Fastify](https://fastify.dev/), собранное через [Fastify CLI](https://www.npmjs.com/package/fastify-cli). Отдаёт JSON и HTML-страницы (шаблоны Pug). Маршруты и плагины подключаются автоматически из папок `routes/` и `plugins/`.

## Создан проект с помощью

```bash
npx fastify generate . --esm
```

## Требования

- [Node.js](https://nodejs.org/) 18+ (рекомендуется LTS)
- npm

## Быстрый старт

```bash
npm install
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

## Скрипты

| Команда        | Назначение |
|----------------|------------|
| `npm run dev`  | Режим разработки: автоперезагрузка при изменении файлов (`-w`), подробные логи, pretty-print |
| `npm start`    | Запуск в production-режиме |
| `npm test`     | Запуск тестов (встроенный `node:test`) |

## Структура проекта

```
fastify-school-app/
├── app.js              # Точка входа приложения (регистрация плагинов и маршрутов)
├── plugins/            # Общие плагины (декораторы, хуки, утилиты)
│   ├── sensible.js     # Удобные HTTP-ошибки (@fastify/sensible)
│   ├── support.js      # Пример кастомного декоратора
│   ├── view.js         # Шаблонизатор Pug (@fastify/view)
│   ├── formbody.js     # Парсинг HTML-форм (@fastify/formbody)
│   ├── reverse-routes.js # Именованные URL (fastify.reverse)
│   └── static.js       # Bootstrap CSS (/assets/)
├── lib/
│   ├── getUsers.js     # Начальные данные пользователей (@faker-js/faker)
│   ├── normalizeEmail.js
│   ├── hashPassword.js
│   ├── RouteNames.js   # Константы имён маршрутов (для fastify.reverse)
│   ├── controllers/
│   │   ├── usersController.js   # Обработчики HTTP для /users
│   │   └── coursesController.js # Обработчики HTTP для /courses
│   ├── schemas/
│   │   ├── createUserSchema.js   # Yup: создание пользователя
│   │   ├── updateUserSchema.js   # Yup: редактирование (PATCH)
│   │   ├── createCourseSchema.js # Yup: создание курса
│   │   └── updateCourseSchema.js # Yup: редактирование курса
│   ├── validation/
│   │   ├── formatYupErrors.js    # Ошибки Yup → объект для Pug
│   │   └── stripFormMethod.js    # _method PATCH/DELETE в HTML-формах
│   └── repositories/
│       ├── usersRepository.js   # In-memory хранилище пользователей
│       └── coursesRepository.js # In-memory хранилище курсов
├── views/              # Pug-шаблоны
│   ├── layout/
│   │   └── page.pug    # Общий layout (Bootstrap, навигация)
│   ├── index.pug       # Главная страница
│   ├── demo.pug
│   ├── courses/
│   │   ├── index.pug   # Список, поиск, кнопки редактирования/удаления
│   │   ├── new.pug     # Создание
│   │   ├── show.pug    # Просмотр
│   │   └── edit.pug    # Редактирование (PATCH) и удаление
│   └── users/
│       ├── index.pug   # Список, кнопки редактирования/удаления
│       ├── new.pug     # Создание
│       ├── show.pug    # Просмотр (кнопка «Редактировать»)
│       └── edit.pug    # Редактирование (PATCH) и удаление
├── routes/             # HTTP-маршруты (каждый файл — Fastify-плагин)
│   ├── root.js         # Маршруты в корне приложения
│   ├── demo/           # Пример HTML-страницы (Pug), префикс /demo
│   ├── courses/        # Курсы, префикс /courses
│   └── users/          # Пользователи, префикс /users
└── test/               # Тесты
    ├── helper.js
    ├── lib/
    │   ├── normalizeEmail.test.js
    │   ├── hashPassword.test.js
    │   ├── createUserSchema.test.js
    │   └── createCourseSchema.test.js
    ├── plugins/
    │   └── support.test.js
    └── routes/
        ├── courses.test.js
        ├── demo.test.js
        ├── root.test.js
        └── users.test.js
```

Точка входа для CLI — `app.js`. Файлы `index.js` и `src/index.js` в репозитории не используются при запуске через `npm run dev` / `npm start`.

## Как устроены маршруты

Все файлы в `routes/` загружаются пакетом [@fastify/autoload](https://github.com/fastify/fastify-autoload). **Путь к файлу задаёт префикс URL**, а пути внутри `fastify.get(...)` дополняют этот префикс.

| Файл | Префикс | Пример: `fastify.get('/')` → |
|------|---------|------------------------------|
| `routes/root.js` | *(корень)* | `GET /` |
| `routes/demo/index.js` | `/demo` | `GET /demo` |
| `routes/users/index.js` | `/users` | `GET /users` |
| `routes/courses/index.js` | `/courses` | `GET /courses` |

### Именованные маршруты (fastify-reverse-routes)

Плагин `plugins/reverse-routes.js` реализует API [fastify-reverse-routes](https://github.com/dimonnwc3/fastify-reverse-routes): декоратор `fastify.reverse(name, params)` строит URL по имени маршрута. Имена собраны в классе `lib/RouteNames.js`.

В обработчиках:

```javascript
import { RouteNames } from '../../lib/RouteNames.js'

return reply.redirect(fastify.reverse(RouteNames.USERS_INDEX))
```

В Pug-шаблонах (через `defaultContext` в `plugins/view.js`):

```pug
a(href=reverse(RouteNames.NEW_USER)) Новый пользователь
a(href=reverse(RouteNames.SHOW_USER, { id: user.id }))= user.username
```

Префиксы URL задаёт autoload по имени папки (`routes/users` → `/users`, `routes/courses` → `/courses`). Менять путь можно, переименовав папку — ссылки в шаблонах и редиректах обновятся автоматически.

Константы имён — в `lib/RouteNames.js` (например `RouteNames.EDIT_USER` → `'editUser'`).

### PATCH и DELETE из HTML-форм

Браузер отправляет формы только методами **GET** и **POST**. Для редактирования и удаления:

1. Зарегистрированы настоящие маршруты `PATCH` и `DELETE` (удобно для тестов и API).
2. Дополнительно `POST /users/:id` и `POST /courses/:id` читают скрытое поле `_method`:

```pug
form(method="POST" action=reverse(RouteNames.UPDATE_USER, { id: user.id }))
  input(type="hidden" name="_method" value="PATCH")
```

```pug
form(method="POST" action=reverse(RouteNames.DELETE_USER, { id: user.id }))
  input(type="hidden" name="_method" value="DELETE")
  button(type="submit") Удалить
```

`lib/validation/stripFormMethod.js` извлекает `_method` и удаляет его из `request.body` перед валидацией Yup.

### Маршруты в корне (`routes/root.js`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/` | HTML-страница (`views/index.pug`) |
| `POST` | `/` | `POST /users` (через `fastify.reverse`) |
| `GET` | `/phones` | JSON-массив телефонов |
| `GET` | `/test` | `Hello World!` или `Hello {name}!` (query-параметр `name`) |
| `GET` | `/test/:id` | HTML-страница с заголовком; параметр `:id` проходит через `sanitize-html` |

### Пользователи

**Роутинг:** `routes/users/index.js` — только привязка URL к обработчикам.  
**Логика:** `lib/controllers/usersController.js` — index, create, show, editForm, update, destroy.

Порядок регистрации маршрутов важен: `/new` и `/:id/edit` — **до** `/:id`.

| Метод | URL | Имя маршрута | Ответ |
|-------|-----|--------------|--------|
| `GET` | `/users` | `usersIndex` | Таблица (10 записей на страницу, `?page=2`); «Назад» / «Вперёд» |
| `GET` | `/users/new` | `newUser` | Форма создания |
| `POST` | `/users` | `createUser` | Создание (Yup); редирект на `/users` или 422 |
| `GET` | `/users/:id/edit` | `editUser` | Форма редактирования |
| `PATCH` | `/users/:id` | `updateUser` | Обновление (Yup); редирект на карточку или 422 |
| `DELETE` | `/users/:id` | `deleteUser` | Удаление; редирект на `/users` |
| `POST` | `/users/:id` | — | То же, что PATCH/DELETE при `_method` в форме |
| `GET` | `/users/:id` | `showUser` | Карточка; кнопка «Редактировать» |

Данные — `lib/repositories/usersRepository.js` (in-memory). Стартовые пользователи: `lib/getUsers.js` (25 записей, фиксированный seed). Список: `getUsersPage(page)` — по 10 пользователей, query-параметр `page` (с 1). Email нормализуется (`lib/normalizeEmail.js`), пароль хешируется (`lib/hashPassword.js`).

#### Создание (POST)

Схема `lib/schemas/createUserSchema.js`:

| Поле | Правила |
|------|---------|
| `username` | обязательное, 2–50 символов |
| `email` | обязательный, корректный email, **уникальный** (без учёта регистра) |
| `password` | обязательный, минимум 6 символов |
| `passwordConfirm` | обязательный, должен совпадать с `password` |

При ошибке — **422** и `views/users/new.pug` с `errors` и `values`.

#### Редактирование (PATCH)

Схема `createUpdateUserSchema(userId)` в `lib/schemas/updateUserSchema.js`:

| Поле | Правила |
|------|---------|
| `username` | как при создании |
| `email` | уникальный, **кроме** редактируемого пользователя |
| `password` | необязательный; пустое поле — пароль не меняется |
| `passwordConfirm` | обязателен только если указан `password` |

Форма: `views/users/edit.pug`. Удаление — на страницах `show`, `edit` и в списке `index`.

```javascript
// lib/schemas/createUserSchema.js
import * as yup from 'yup'

export const createUserSchema = yup.object({
  username: yup.string().trim().required('Введите имя пользователя').min(2).max(50),
  email: yup.string().trim().required('Введите email').email('Введите корректный email')
    .test('unique-email', 'Пользователь с таким email уже существует', (value) => !value || !isEmailTaken(value)),
  password: yup.string().required('Введите пароль').min(6, 'Пароль должен содержать минимум 6 символов'),
  passwordConfirm: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),
})
```

```javascript
// routes/users/index.js — только регистрация
import * as usersController from '../../lib/controllers/usersController.js'

fastify.post('/', { name: RouteNames.CREATE_USER }, usersController.create)
fastify.patch('/:id', { name: RouteNames.UPDATE_USER }, usersController.update)
```

```javascript
// lib/normalizeEmail.js
export default function normalizeEmail (email) {
  return email.trim().toLowerCase()
}
```

### Курсы

**Роутинг:** `routes/courses/index.js`  
**Логика:** `lib/controllers/coursesController.js`

| Метод | URL | Имя маршрута | Ответ |
|-------|-----|--------------|--------|
| `GET` | `/courses` | `coursesIndex` | Список, поиск `?q=`, редактирование/удаление |
| `GET` | `/courses/new` | `newCourse` | Форма создания |
| `POST` | `/courses` | `createCourse` | Создание (Yup); редирект или 422 |
| `GET` | `/courses/:id/lessons/:postId` | `courseLesson` | Текст `Course ID: …; Post ID: …` |
| `GET` | `/courses/:id/edit` | `editCourse` | Форма редактирования |
| `PATCH` | `/courses/:id` | `updateCourse` | Обновление (Yup); редирект на просмотр или 422 |
| `DELETE` | `/courses/:id` | `deleteCourse` | Удаление; редирект на `/courses` |
| `POST` | `/courses/:id` | — | PATCH/DELETE через `_method` |
| `GET` | `/courses/:id` | `showCourse` | Просмотр курса; кнопка «Редактировать» |

| `GET` | `/courses?q=массивы` | «JS: Массивы» — подстрока в названии |
| `GET` | `/courses?q=JavaScript` | Оба курса — подстрока в описании |
| `GET` | `/courses?q=python` | «Курсы не найдены» |

Данные — `lib/repositories/coursesRepository.js`. Формы — `@fastify/formbody` (`plugins/formbody.js`).

#### Создание (POST)

Схема `lib/schemas/createCourseSchema.js`:

| Поле | Правила |
|------|---------|
| `title` | обязательное, 2–50 символов, **уникальное** (без учёта регистра и пробелов по краям) |
| `description` | обязательное, 10–500 символов |

При ошибке — **422** и `views/courses/new.pug`.

#### Редактирование (PATCH)

Схема `createUpdateCourseSchema(courseId)` в `lib/schemas/updateCourseSchema.js` — те же правила, что при создании; название уникально **кроме** текущего курса.

Шаблоны: `views/courses/show.pug`, `edit.pug`, кнопки в `index.pug`.

```javascript
// lib/schemas/createCourseSchema.js
import * as yup from 'yup'

export const createCourseSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Введите название курса')
    .min(2, 'Название курса должно содержать минимум 2 символа')
    .max(50, 'Название курса не должно превышать 50 символов')
    .test('unique-title', 'Курс с таким названием уже существует', (value) => !value || !isCourseTitleTaken(value)),
  description: yup
    .string()
    .trim()
    .required('Введите описание курса')
    .min(10, 'Описание курса должно содержать минимум 10 символов')
    .max(500, 'Описание курса не должно превышать 500 символов'),
})
```

```javascript
// routes/courses/index.js
try {
  const data = await createCourseSchema.validate(request.body, {
    abortEarly: false,
    stripUnknown: true,
  })
  createCourse({ title: data.title, description: data.description })
  return reply.redirect(fastify.reverse(RouteNames.COURSES_INDEX))
} catch (error) {
  if (error.name === 'ValidationError') {
    return renderNewCourseForm(reply.code(422), {
      errors: formatYupErrors(error),
      values: request.body,
    })
  }
  throw error
}
```

### HTML через Pug (`routes/demo/index.js`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/demo` | HTML-страница из шаблона `views/demo.pug` |

Настройка движка шаблонов — в `plugins/view.js`. В маршруте используется `reply.view('demo', { title, message })`.

**Когда что использовать:**

- **`routes/имя.js`** — эндпоинты без общего префикса (главная, `/test` и т.п.).
- **`routes/имя/index.js`** — логическая группа под одним префиксом (`/demo`, `/users`, `/courses`). В папку можно добавлять другие файлы, не раздувая один большой модуль.

Подробнее о соглашениях — в [routes/README.md](routes/README.md).

## Защита от XSS

В приложении используются два уровня защиты.

### 1. Автоэкранирование в Pug

Оператор `=` в шаблонах превращает `<script>` в безопасный текст (`&lt;script&gt;`). Например, в `views/courses/index.pug`:

```pug
h1= header
p= course.description
```

Опасным считается вывод через `!=` без предварительной очистки.

### 2. `sanitize-html` для HTML-ответов

Маршрут `GET /test/:id` отдаёт HTML (`Content-Type: text/html`) и подставляет параметр URL в разметку. Перед вставкой значение очищается через [sanitize-html](https://www.npmjs.com/package/sanitize-html):

```javascript
const clean = sanitizeHtml(id, {
  allowedTags: ['h2', 'a', 'p'],
  allowedAttributes: { a: ['href', 'target'] },
  allowedSchemes: ['http', 'https', 'mailto'],
})
```

Пример проверки:

```
http://127.0.0.1:3000/test/%3Cscript%3Ealert('attack!')%3B%3C%2Fscript%3E
```

Тег `<script>` будет удалён — alert не выполнится.

### Почему plain text безопасен сам по себе

Маршруты, которые отвечают через `res.send('строка')` без `reply.type('html')`, отдают `Content-Type: text/plain`. Браузер не интерпретирует такой ответ как HTML, поэтому теги вроде `<script>` отображаются как текст, а не выполняются. Это не замена санитизации: как только данные попадают в HTML-контекст, нужны экранирование или `sanitize-html`.

## Плагины

Папка `plugins/` — для кода, общего для всего приложения: аутентификация, кэш, декораторы, хуки. Подробности — в [plugins/README.md](plugins/README.md).

## Тестирование

```bash
npm test
```

Тесты лежат в `test/` и проверяют маршруты через `inject()` без поднятия реального HTTP-сервера. Для PATCH и DELETE в тестах используются настоящие HTTP-методы; в браузере — POST с `_method`.

## Полезные ссылки

### Fastify

- [Документация Fastify](https://fastify.dev/docs/latest/)
- [Маршруты](https://fastify.dev/docs/latest/Reference/Routes/)
- [Именованные маршруты](https://fastify.dev/docs/latest/Reference/Routes/#route-options) (`name: RouteNames.NEW_USER`)
- [fastify-reverse-routes](https://github.com/dimonnwc3/fastify-reverse-routes) — генерация URL по имени маршрута
- [Плагины](https://fastify.dev/docs/latest/Reference/Plugins/)
- [@fastify/autoload](https://github.com/fastify/fastify-autoload) — автозагрузка `routes/` и `plugins/`
- [@fastify/formbody](https://github.com/fastify/fastify-formbody) — парсинг HTML-форм
- [@fastify/view](https://github.com/fastify/point-of-view) — шаблонизатор Pug
- [@fastify/static](https://github.com/fastify/fastify-static) — статические файлы (`/assets/`)
- [@fastify/sensible](https://github.com/fastify/fastify-sensible) — HTTP-ошибки
- [Тестирование через `inject()`](https://fastify.dev/docs/latest/Guides/Testing/)

### Шаблоны и UI

- [Pug — синтаксис](https://pugjs.org/api/getting-started.html)
- [Bootstrap 5](https://getbootstrap.com/docs/5.3/getting-started/introduction/)

### Валидация и данные

- [Yup — схемы валидации](https://github.com/jquense/yup)
- [Faker.js](https://fakerjs.dev/) — генерация тестовых пользователей
- [crypto-js](https://github.com/brix/crypto-js) — хеширование паролей (учебный пример)

### Безопасность

- [sanitize-html](https://www.npmjs.com/package/sanitize-html) — очистка HTML в `GET /test/:id`

### Node.js

- [Встроенный тест-раннер `node:test`](https://nodejs.org/api/test.html)
- [Fastify CLI](https://www.npmjs.com/package/fastify-cli)
