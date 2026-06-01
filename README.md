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
│   └── static.js       # Bootstrap CSS (/assets/)
├── lib/
│   ├── getUsers.js     # Начальные данные пользователей (@faker-js/faker)
│   ├── normalizeEmail.js
│   ├── hashPassword.js
│   ├── schemas/
│   │   ├── createUserSchema.js   # Yup-схема валидации пользователя
│   │   └── createCourseSchema.js # Yup-схема валидации курса
│   ├── validation/
│   │   └── formatYupErrors.js   # Преобразование ошибок Yup для шаблона
│   └── repositories/
│       ├── usersRepository.js   # In-memory хранилище пользователей
│       └── coursesRepository.js # In-memory хранилище курсов
├── views/              # Pug-шаблоны
│   ├── layout/
│   │   └── page.pug    # Общий layout (Bootstrap, навигация)
│   ├── index.pug       # Главная страница
│   ├── demo.pug
│   ├── courses/
│   │   ├── index.pug   # Список курсов и поиск
│   │   └── new.pug     # Форма создания курса
│   └── users/
│       ├── index.pug   # Список пользователей
│       ├── new.pug     # Форма создания пользователя
│       └── show.pug    # Карточка пользователя
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

### Маршруты в корне (`routes/root.js`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/` | HTML-страница (`views/index.pug`) |
| `POST` | `/` | `POST /users` |
| `GET` | `/phones` | JSON-массив телефонов |
| `GET` | `/test` | `Hello World!` или `Hello {name}!` (query-параметр `name`) |
| `GET` | `/test/:id` | HTML-страница с заголовком; параметр `:id` проходит через `sanitize-html` |

### Пользователи (`routes/users/index.js`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/users` | Таблица пользователей (`views/users/index.pug`) |
| `GET` | `/users/new` | Форма создания пользователя (`views/users/new.pug`, имя маршрута `newUser`) |
| `POST` | `/users` | Создание пользователя с валидацией (Yup); при успехе — редирект на `/users`, при ошибке — форма с сообщениями (422) |
| `GET` | `/users/:id` | Карточка пользователя или `404` с текстом `User not found` |

Данные хранятся в `lib/repositories/usersRepository.js`. Начальный список генерируется через `lib/getUsers.js` (100 пользователей, фиксированный seed). При создании email нормализуется через `lib/normalizeEmail.js` (trim + lowercase), пароль хешируется через `lib/hashPassword.js`.

#### Валидация формы (Yup)

Перед созданием пользователя данные проверяются схемой `lib/schemas/createUserSchema.js`:

| Поле | Правила |
|------|---------|
| `username` | обязательное, 2–50 символов |
| `email` | обязательный, корректный email |
| `password` | обязательный, минимум 6 символов |
| `passwordConfirm` | обязательный, должен совпадать с `password` |

При ошибке валидации обработчик `POST /users` возвращает статус **422** и снова рендерит `views/users/new.pug` с объектами `errors` и `values` (имя и email сохраняются в полях, пароли не подставляются).

```javascript
// lib/schemas/createUserSchema.js
import * as yup from 'yup'

export const createUserSchema = yup.object({
  username: yup.string().trim().required('Введите имя пользователя').min(2).max(50),
  email: yup.string().trim().required('Введите email').email('Введите корректный email'),
  password: yup.string().required('Введите пароль').min(6, 'Пароль должен содержать минимум 6 символов'),
  passwordConfirm: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),
})
```

```javascript
// routes/users/index.js
try {
  const data = await createUserSchema.validate(request.body, {
    abortEarly: false,
    stripUnknown: true,
  })
  createUser({ username: data.username, email: data.email, password: data.password })
  return reply.redirect('/users')
} catch (error) {
  if (error.name === 'ValidationError') {
    return reply.code(422).view('users/new', {
      errors: formatYupErrors(error),
      values: request.body,
    })
  }
  throw error
}
```

```javascript
// lib/normalizeEmail.js
export default function normalizeEmail (email) {
  return email.trim().toLowerCase()
}
```

### Курсы (`routes/courses/index.js`, `views/courses/index.pug`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/courses` | HTML-список курсов; опциональный query-параметр `q` для поиска |
| `GET` | `/courses/new` | Форма создания курса (`views/courses/new.pug`, имя маршрута `newCourse`) |
| `POST` | `/courses` | Создание курса с валидацией (Yup); при успехе — редирект на `/courses`, при ошибке — форма с сообщениями (422) |
| `GET` | `/courses/:id/lessons/:postId` | `Course ID: {id}; Post ID: {postId}` (plain text) |

| `GET` | `/courses?q=массивы` | «JS: Массивы» — подстрока есть в названии |
| `GET` | `/courses?q=JavaScript` | Оба курса — подстрока есть в описании |
| `GET` | `/courses?q=python` | Пустой список и сообщение «Курсы не найдены» |

Данные хранятся в `lib/repositories/coursesRepository.js`. Поиск и добавление курсов работают через формы на странице `/courses`. POST-запросы обрабатываются благодаря плагину `@fastify/formbody` (`plugins/formbody.js`).

#### Валидация формы (Yup)

Перед созданием курса данные проверяются схемой `lib/schemas/createCourseSchema.js`:

| Поле | Правила |
|------|---------|
| `title` | обязательное, 2–50 символов |
| `description` | обязательное, 10–500 символов |

При ошибке валидации обработчик `POST /courses` возвращает статус **422** и снова рендерит `views/courses/new.pug` с объектами `errors` и `values` (введённые название и описание сохраняются в полях формы).

```javascript
// lib/schemas/createCourseSchema.js
import * as yup from 'yup'

export const createCourseSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Введите название курса')
    .min(2, 'Название курса должно содержать минимум 2 символа')
    .max(50, 'Название курса не должно превышать 50 символов'),
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
  return reply.redirect('/courses')
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

- **`routes/имя.js`** — эндпоинты без общего префикса (главная, `/courses`, `/test` и т.п.).
- **`routes/имя/index.js`** — логическая группа под одним префиксом (`/demo`, `/users`). В папку можно добавлять другие файлы, не раздувая один большой модуль.

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

Тесты лежат в `test/` и проверяют маршруты через `inject()` без поднятия реального HTTP-сервера.

## Полезные ссылки

### Fastify

- [Документация Fastify](https://fastify.dev/docs/latest/)
- [Маршруты](https://fastify.dev/docs/latest/Reference/Routes/)
- [Именованные маршруты](https://fastify.dev/docs/latest/Reference/Routes/#route-options) (`name: 'newUser'`)
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
