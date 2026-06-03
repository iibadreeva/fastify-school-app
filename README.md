# fastify-school-app

Учебное SSR-приложение на [Fastify](https://fastify.dev/) ([Fastify CLI](https://www.npmjs.com/package/fastify-cli)): HTML через [Pug](https://pugjs.org/) и Bootstrap, данные в [SQLite](https://www.sqlite.org/) через [sql.js](https://sql.js.org/) (WASM, без native-модулей). Есть сессии, вход/регистрация, flash-сообщения, CRUD пользователей и курсов с валидацией [Yup](https://github.com/jquense/yup). Маршруты и плагины подключаются автоматически из `routes/` и `plugins/` ([@fastify/autoload](https://github.com/fastify/fastify-autoload)); отдельные JSON-эндпоинты — в `routes/root.js`.

Многослойный монолит (layered monolith): HTTP → плагины → маршруты → контроллеры → репозитории → шаблоны.

```
HTTP-запрос
    ↓
plugins/          — SQLite, cookie, session, flash, auth-context, no-cache, …
    ↓
routes/           — маршрутизация (URL → обработчик)
    ↓
controllers/      — сценарии HTTP (валидация, редирект, выбор шаблона)
    ↓
repositories/     — SQLite (CRUD, пейджинг, поиск)
    ↓
views/ (Pug)      — HTML-ответ
```

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
| `npm run dev`  | Режим разработки: автоперезагрузка (`-w`), логи; папка `data/` (SQLite) **не** отслеживается — иначе после регистрации сервер перезапускается и отдаёт 503 |
| `npm start`    | Production: слушает `0.0.0.0`, порт из `PORT` (Render задаёт автоматически) |
| `npm test`     | Запуск тестов (встроенный `node:test`) |

## Структура проекта

```
fastify-school-app/
├── app.js              # Точка входа приложения (регистрация плагинов и маршрутов)
├── plugins/            # Общие плагины (декораторы, хуки, утилиты)
│   ├── sensible.js     # Удобные HTTP-ошибки (@fastify/sensible)
│   ├── support.js      # Пример кастомного декоратора
│   ├── database.js     # SQLite: схема, сиды, закрытие при остановке
│   ├── cookie.js       # Cookie: request.cookies, reply.setCookie
│   ├── session.js      # Серверные сессии (@fastify/session)
│   ├── flash.js        # Flash-сообщения (@fastify/flash)
│   ├── auth-context.js # currentUser и flashMessages в reply.locals
│   ├── no-cache.js     # Cache-Control: no-store на все ответы
│   ├── middie.js       # Middleware Express-стиля (fastify.use)
│   ├── request-log.js  # Access log в dev (morgan)
│   ├── view.js         # Шаблонизатор Pug (@fastify/view)
│   ├── formbody.js     # Парсинг HTML-форм (@fastify/formbody)
│   ├── reverse-routes.js # Именованные URL (fastify.reverse)
│   └── static.js       # Bootstrap CSS (/assets/)
├── lib/
│   ├── db/
│   │   └── connection.js         # SQLite: открытие, схема, сиды
│   ├── getUsers.js     # Начальные пользователи для сида (@faker-js/faker)
│   ├── normalizeEmail.js
│   ├── hashPassword.js
│   ├── RouteNames.js   # Константы имён маршрутов (для fastify.reverse)
│   ├── auth/
│   │   └── sessionAuth.js        # loginSession, redirectIfGuest
│   ├── flash/
│   │   └── flashMessages.js      # setFlashSuccess/Error, getFlashMessages
│   ├── controllers/
│   │   ├── authController.js     # Вход, регистрация, профиль, выход
│   │   ├── usersController.js   # Обработчики HTTP для /users
│   │   └── coursesController.js # Обработчики HTTP для /courses
│   ├── verifyPassword.js
│   ├── schemas/
│   │   ├── createUserSchema.js   # Yup: создание пользователя
│   │   ├── loginSchema.js        # Yup: вход
│   │   ├── updateUserSchema.js   # Yup: редактирование (PATCH)
│   │   ├── createCourseSchema.js # Yup: создание курса
│   │   └── updateCourseSchema.js # Yup: редактирование курса
│   ├── validation/
│   │   ├── formatYupErrors.js    # Ошибки Yup → объект для Pug
│   │   └── stripFormMethod.js    # _method PATCH/DELETE в HTML-формах
│   └── repositories/
│       ├── usersRepository.js   # Пользователи (SQLite)
│       └── coursesRepository.js # Курсы (SQLite)
├── views/              # Pug-шаблоны
│   ├── layout/
│   │   └── page.pug    # Layout: навигация, Вход/Профиль/Выход
│   ├── index.pug       # Главная страница
│   ├── demo.pug
│   ├── auth/
│   │   ├── login.pug
│   │   ├── register.pug
│   │   └── profile.pug
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
│   ├── auth/           # Вход, регистрация, профиль, префикс /auth
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
    │   ├── cookie.test.js
    │   ├── no-cache.test.js
    │   └── support.test.js
    └── routes/
        ├── auth.test.js
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
| `routes/auth/index.js` | `/auth` | `GET /auth/login` |
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

### Аутентификация (`/auth`)

**Роутинг:** `routes/auth/index.js`  
**Логика:** `lib/controllers/authController.js`  
**Сессия:** `request.session.userId` после входа или регистрации

В шапке (`views/layout/page.pug`): для гостя — «Вход» и «Регистрация»; для авторизованного — имя (ссылка на профиль) и кнопка «Выход».

| Метод | URL | Имя маршрута | Ответ |
|-------|-----|--------------|--------|
| `GET` | `/auth/login` | `authLogin` | Форма входа |
| `POST` | `/auth/login` | `authLoginPost` | Проверка email/пароля; редирект на профиль или 422 |
| `GET` | `/auth/register` | `authRegister` | Форма регистрации |
| `POST` | `/auth/register` | `authRegisterPost` | Создание пользователя (Yup), автоматический вход, редирект на профиль |
| `GET` | `/auth/profile` | `authProfile` | Профиль (только для авторизованных; иначе редирект на `/auth/login`) |
| `POST` | `/auth/logout` | `authLogout` | `session.destroy()`, редирект на `/` |

Регистрация использует ту же Yup-схему, что `POST /users` (`createUserSchema`). Вход — `lib/schemas/loginSchema.js`, проверка пароля — `lib/verifyPassword.js`.

> **Отличие:** `/users/new` — добавление в общий список **только для вошедших пользователей** (кнопка на `/users` видна при `currentUser`); `/auth/register` — регистрация аккаунта для любого гостя.

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
| `GET` | `/users/new` | `newUser` | Форма создания (**только авторизованные**, иначе редирект на `/auth/login`) |
| `POST` | `/users` | `createUser` | Создание (Yup); **только авторизованные**; редирект на `/users` или 422 |
| `GET` | `/users/:id/edit` | `editUser` | Форма редактирования |
| `PATCH` | `/users/:id` | `updateUser` | Обновление (Yup); редирект на карточку или 422 |
| `DELETE` | `/users/:id` | `deleteUser` | Удаление; редирект на `/users` |
| `POST` | `/users/:id` | — | То же, что PATCH/DELETE при `_method` в форме |
| `GET` | `/users/:id` | `showUser` | Карточка; кнопка «Редактировать» |

Данные — `lib/repositories/usersRepository.js` (SQLite через `lib/db/connection.js`). При первом запуске в пустую БД подставляются 25 пользователей из `lib/getUsers.js` (фиксированный seed faker). Список: `getUsersPage(page)` — по 10 пользователей, query-параметр `page` (с 1). Email нормализуется (`lib/normalizeEmail.js`), пароль хешируется (`lib/hashPassword.js`). Файл БД по умолчанию: `data/app.sqlite` (в `.gitignore`); в тестах — `:memory:`.

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

Данные — `lib/repositories/coursesRepository.js` (SQLite). Стартовые курсы: «JS: Массивы» (id=1), «JS: Функции» (id=2). Формы — `@fastify/formbody` (`plugins/formbody.js`).

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
| `GET` | `/demo` | HTML-страница из шаблона `views/demo.pug`; счётчик визитов в cookie `demo_visits` |

Настройка движка шаблонов — в `plugins/view.js`. В маршруте используется `reply.view('demo', { title, message, visits })`.

**Демо `@fastify/cookie`:** при каждом заходе на `/demo` значение в подписанной cookie увеличивается на 1; на странице показывается «Визитов: N». Cookie: `httpOnly`, `sameSite: 'lax'`, `signed: true` (см. `plugins/cookie.js`). Проверка: обновите `/demo` несколько раз в браузере или запустите `npm test` (`test/plugins/cookie.test.js`).

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

Папка `plugins/` — для кода, общего для всего приложения: аутентификация, кэш, декораторы, хуки. Файлы подхватываются [@fastify/autoload](https://github.com/fastify/fastify-autoload) в алфавитном порядке; порядок важен для связанных плагинов (`middie.js` → `request-log.js`).

### `decorate`, `decorateRequest` и `addHook`

В Fastify плагины расширяют приложение тремя основными способами. **Не все три обязательны** — выбирайте по задаче.

| Механизм | Куда добавляет | Типичное назначение |
|----------|----------------|---------------------|
| [`fastify.decorate`](https://fastify.dev/docs/latest/Reference/Decorators/) | Инстанс Fastify (`fastify.*`) | Общий API приложения: сервисы, утилиты, `fastify.reverse` |
| [`fastify.decorateRequest`](https://fastify.dev/docs/latest/Reference/Decorators/#decoraterequest) / [`decorateReply`](https://fastify.dev/docs/latest/Reference/Decorators/#decoratereply) | Каждый `request` / `reply` | Поля и методы на каждом запросе: `request.user`, `request.flash()` |
| [`fastify.addHook`](https://fastify.dev/docs/latest/Reference/Hooks/) | Жизненный цикл запроса | Сквозная логика без копипасты в маршрутах: auth, заголовки, логи |

#### Что используется в этом проекте

| Механизм | Файл | Зачем |
|----------|------|--------|
| `decorate` | `plugins/reverse-routes.js` | `fastify.reverse(name)` — построение URL по имени маршрута |
| `decorate` | `plugins/support.js` | Пример из Fastify CLI (`fastify.someSupport`) — учебный, в логике приложения не участвует |
| `addHook` (`preHandler`) | `plugins/auth-context.js` | `currentUser` и `flashMessages` в `reply.locals` для всех Pug-шаблонов |
| `addHook` (`onSend`) | `plugins/no-cache.js` | `Cache-Control: no-store` на каждый ответ |
| `addHook` (`onRoute`) | `plugins/reverse-routes.js` | Сбор карты имён маршрутов при регистрации |
| `decorateRequest` | — | **Своих декораторов нет** — используем готовые из плагинов |
| `decorateRequest` (из пакетов) | `session.js`, `flash.js` | `request.session`, `request.flash()` — внутри `@fastify/session` и `@fastify/flash` |

#### Когда что выбирать

```
Нужно на всём приложении (один раз)?     → decorate (fastify.*)
Нужно на каждом request/reply?           → decorateRequest / decorateReply
                                         ИЛИ preHandler + request / reply.locals
Нужно на каждом ответе / при регистрации маршрута? → addHook (onSend, onRoute, …)
Логика только одного маршрута?           → контроллер или hook с scope: 'route'
```

- **`decorate`** — да, если API должен быть доступен как `fastify.reverse(...)` или `request.server.reverse(...)` из любого места. Без декоратора пришлось бы тащить отдельный модуль с состоянием.
- **`addHook`** — да, если одно и то же должно выполняться на многих или всех маршрутах (шапка, flash, кэш). Не дублируйте hook в контроллерах: для одного сценария достаточно `setFlashSuccess` / `redirectIfGuest` в `lib/controllers/`.
- **`decorateRequest`** — **не обязателен** в текущей архитектуре. Авторизация идёт через `request.session.userId` и `lib/auth/sessionAuth.js`; для шаблонов — `preHandler` в `auth-context.js` и `reply.locals`. Имеет смысл добавлять свой `request.user`, только если одно и то же поле понадобится в десятках обработчиков и хочется единый контракт на `request` вместо `reply.locals.currentUser`.

Плагины оформляются через [`fastify-plugin`](https://github.com/fastify/fastify-plugin) (`fp`), чтобы декораторы и хуки были видны снаружи папки `plugins/` (см. комментарий в `support.js`).

### SQLite (`sql.js`)

Плагин `plugins/database.js` (имя `database`) открывает БД при старте и закрывает при `onClose`. Движок — **sql.js** (SQLite в WebAssembly): работает на Windows, Linux и Render **без** native-бинарников и ошибок `GLIBC_2.38` / `ERR_DLOPEN_FAILED`.

| Переменная / режим | Путь к файлу |
|--------------------|--------------|
| `DATABASE_PATH` | Явный путь (в тестах helper задаёт `:memory:`) |
| production / dev | `data/app.sqlite` (создаётся автоматически) |
| `NODE_ENV=test` | `:memory:` (если `DATABASE_PATH` не задан) |

Таблицы `users` и `courses` создаются в `lib/db/connection.js`. Если таблица `users` пуста — один раз загружаются сиды из `getUsers()` и два начальных курса. Репозитории — асинхронные (`await findUserById`, `await createUser`, …). `auth-context` зависит от плагина `database`.

Чтобы сбросить данные в dev, удалите `data/app.sqlite` и перезапустите приложение.

**503 при регистрации в dev:** JSON `{"error":"Service Unavailable","statusCode":503}` обычно значит, что запрос попал в момент перезапуска сервера (`-w`). Частая причина — изменение `data/app.sqlite` без `--ignore-watch=data` (исправлено в `npm run dev`). Перезапустите сервер один раз и повторите отправку формы.

### Логирование HTTP-запросов (dev)

| Плагин | Пакет | Назначение |
|--------|-------|------------|
| `plugins/middie.js` | [@fastify/middie](https://github.com/fastify/middie) | Включает `fastify.use()` для middleware в стиле Express |
| `plugins/request-log.js` | [morgan](https://github.com/expressjs/morgan) | Печатает в консоль строку на каждый запрос, например `GET /users 200 12.345 ms` |

**Где срабатывает:** на каждый входящий HTTP-запрос, до маршрутов и контроллеров — на уровне инфраструктуры, рядом с `formbody` и `static`.

**Режимы:**

- `npm run dev` — morgan включён (формат `dev`, цветной вывод).
- `npm start` (`NODE_ENV=production`) — morgan **выключен**; остаётся встроенный [Pino](https://getpino.io/) через `fastify.log`, без дублирования access log.

Чтобы подключить другое Express-middleware, зарегистрируйте его через `fastify.use(...)` в отдельном файле в `plugins/` и укажите зависимость `{ dependencies: ['middie'] }`, как в `request-log.js`.

### Cookie (`@fastify/cookie`)

Плагин `plugins/cookie.js` регистрирует [@fastify/cookie](https://github.com/fastify/fastify-cookie):

| API | Назначение |
|-----|------------|
| `request.cookies` | Прочитать cookie из входящего запроса |
| `request.unsignCookie(value)` | Проверить подпись и получить значение (для `signed: true`) |
| `reply.setCookie(name, value, options)` | Отправить `Set-Cookie` |
| `reply.clearCookie(name)` | Удалить cookie (например при выходе из аккаунта) |

Секрет подписи: переменная окружения `COOKIE_SECRET` (в dev — значение по умолчанию в плагине; в production задайте свой секрет).

**Пример в проекте:** `GET /demo` — счётчик `demo_visits` в `routes/demo/index.js`, тест в `test/plugins/cookie.test.js`.

### Session (`@fastify/session`) — зачем нужна

Плагин `plugins/session.js` регистрирует [@fastify/session](https://github.com/fastify/session). **Обязательно после** `@fastify/cookie` (`dependencies: ['cookie']`).

#### Cookie alone vs Session

| | Только `@fastify/cookie` | `@fastify/cookie` + `@fastify/session` |
|---|--------------------------|----------------------------------------|
| Что в браузере | Любые пары ключ–значение (`visited`, `demo_visits`) | Короткий **sessionId** |
| Где данные | Вся информация в cookie (лимит ~4 KB, видна клиенту) | **На сервере** (in-memory store): `userId`, корзина, роли |
| Вход / выход | Приходится самому класть `userId` в cookie — небезопасно | `request.session.userId`; `session.destroy()` при выходе |
| Подделка | Только `signed: true` защищает от изменения | Id сессии + серверная проверка |

**Зачем session в этом проекте:**

1. **Вход и профиль** — после логина в сессии хранится только `userId`; email и имя подгружаются из репозитория (`plugins/auth-context.js` → `currentUser` в шаблонах).
2. **Выход** — `POST /auth/logout` уничтожает сессию на сервере; повторный заход на `/auth/profile` без cookie сессии ведёт на страницу входа (вместе с `Cache-Control: no-store` браузер не показывает старый HTML из кэша).
3. **Не кладём пароль и лишние PII в cookie** — в браузере только идентификатор сессии.

`plugins/auth-context.js` на каждый запрос читает `request.session.userId`, находит пользователя и кладёт `{ id, username, email }` в `reply.locals.currentUser` для шапки и страниц.

Секрет сессии: `SESSION_SECRET` (минимум 32 символа). В dev — значение по умолчанию в `plugins/session.js`.

Тесты: `test/routes/auth.test.js` (регистрация, неверный пароль, logout, шапка).

### Flash-сообщения (`@fastify/flash`)

Плагин `plugins/flash.js` (после `session`) хранит одноразовые сообщения в сессии.

| Тип | Bootstrap | Когда |
|-----|-----------|--------|
| `success` | `alert-success` (зелёный) | Вход, выход, регистрация (`Аккаунт создан`), CRUD пользователей/курсов (создание, PATCH, DELETE) |
| `error` | `alert-danger` (красный) | Ошибки валидации, неверный логин, «Войдите, чтобы продолжить» (`redirectIfGuest`), не найден при удалении |

Сообщения выводятся в `views/layout/page.pug` над контентом страницы. После redirect текст читается в `plugins/auth-context.js` через `reply.flash()`; при ответе 422 — в контроллере перед `reply.view`. При выходе сбрасывается только `userId` в сессии (не `destroy`), чтобы flash дошёл до главной страницы.

### Cache-Control: no-store

Плагин `plugins/no-cache.js` через хук `onSend` добавляет ко **всем ответам** заголовок:

```http
Cache-Control: no-store
```

**Зачем это нужно** [^1][^2]

| Проблема без заголовка | Что даёт `no-store` |
|------------------------|---------------------|
| Браузер может сохранить HTML/JSON и показать **устаревший** список пользователей или курсов после POST/PATCH/DELETE | Каждый запрос заново загружает актуальные данные с сервера |
| После «Назад» в истории показывается **кэшированная** форма или страница (в т.ч. `/users`, редактирование с email) | Страницы не подставляются из локального кэша — нужен новый запрос к серверу |
| **Конфиденциальные данные** (личный кабинет, `/auth/profile`): после выхода другой человек жмёт «Назад» — браузер может показать страницу **с диска без запроса** | При «Назад» — **реальный запрос**; без сессии сервер редиректит на `/auth/login` |
| **Публичный компьютер** (интернет-кафе, библиотека): HTML и данные форм остаются **на жёстком диске** общего ПК | Копии просмотренных страниц **не сохраняются** на диске устройства (дополнение к выходу из аккаунта, не замена) |
| Прокси и CDN могут **закэшировать** ответ и отдать его другому клиенту | Явный запрет хранить ответ где угодно (диск, память, промежуточные узлы) |

`no-store` строже, чем `no-cache`: сервер и клиент **не должны сохранять** копию ответа. Для приложения с данными в SQLite и HTML-формами это разумное значение по умолчанию.

Проверка в DevTools → Network: у любого ответа (например `GET /users`) в заголовках Response должно быть `cache-control: no-store`.

[^1]: [MDN — заголовок `Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) (`no-store`: не сохранять ответ в кэше).
[^2]: [OWASP — Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) (рекомендации по защите сессий и чувствительных данных в браузере).

## Деплой на Render

В репозитории есть [`render.yaml`](render.yaml) (Blueprint). БД на **sql.js** (WASM) — отдельная сборка native-модулей не нужна.

### Через Blueprint (рекомендуется)

1. Подключите репозиторий на [Render](https://render.com/) → **New** → **Blueprint** → выберите репозиторий.
2. Render подхватит `render.yaml`: build, start, секреты, диск для SQLite.

### Вручную (Web Service)

| Поле | Значение |
|------|----------|
| **Build Command** | `npm ci` |
| **Start Command** | `npm start` |
| **Node** | 20+ |

**Environment:**

| Переменная | Значение |
|------------|----------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | случайная строка ≥ 32 символов |
| `COOKIE_SECRET` | случайная строка |
| `DATABASE_PATH` | `/var/data/app.sqlite` (если подключён Persistent Disk) |

**Persistent Disk** (1 GB, mount `/var/data`) — чтобы SQLite не терялся при redeploy. Без диска данные живут только до перезапуска инстанса.

### Важно

- **`node_modules` не коммитить** — Render ставит зависимости сам.
- После смены зависимостей: **Clear build cache & deploy**.
- `npm start` слушает `0.0.0.0`; порт берётся из `PORT` (Render задаёт автоматически).
- В production cookie сессии с `secure: true` (HTTPS на Render).

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
- [@fastify/cookie](https://github.com/fastify/fastify-cookie) — cookie в запросах и ответах
- [@fastify/session](https://github.com/fastify/session) — серверные сессии (вход, профиль)
- [@fastify/flash](https://github.com/fastify/flash) — одноразовые сообщения после redirect
- [@fastify/formbody](https://github.com/fastify/fastify-formbody) — парсинг HTML-форм
- [@fastify/view](https://github.com/fastify/point-of-view) — шаблонизатор Pug
- [@fastify/static](https://github.com/fastify/fastify-static) — статические файлы (`/assets/`)
- [@fastify/sensible](https://github.com/fastify/fastify-sensible) — HTTP-ошибки
- [@fastify/middie](https://github.com/fastify/middie) — middleware Express-стиля (`fastify.use`)
- [morgan](https://github.com/expressjs/morgan) — access log в консоль (dev)
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
