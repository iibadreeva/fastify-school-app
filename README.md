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
│   └── static.js       # Bootstrap CSS (/assets/)
├── lib/
│   └── getUsers.js     # Список пользователей (@faker-js/faker)
├── views/              # Pug-шаблоны
│   ├── layout/
│   │   └── page.pug    # Общий layout (Bootstrap, навигация)
│   ├── index.pug       # Главная страница
│   ├── curses.pug      # Список курсов
│   ├── demo.pug
│   └── users/
├── routes/             # HTTP-маршруты (каждый файл — Fastify-плагин)
│   ├── root.js         # Маршруты в корне приложения
│   ├── demo/           # Пример HTML-страницы (Pug), префикс /demo
│   └── users/          # Пользователи, префикс /users
└── test/               # Тесты
```

Точка входа для CLI — `app.js`. Файлы `index.js` и `src/index.js` в репозитории не используются при запуске через `npm run dev` / `npm start`.

## Как устроены маршруты

Все файлы в `routes/` загружаются пакетом [@fastify/autoload](https://github.com/fastify/fastify-autoload). **Путь к файлу задаёт префикс URL**, а пути внутри `fastify.get(...)` дополняют этот префикс.

| Файл | Префикс | Пример: `fastify.get('/')` → |
|------|---------|------------------------------|
| `routes/root.js` | *(корень)* | `GET /` |
| `routes/demo/index.js` | `/demo` | `GET /demo` |
| `routes/users/index.js` | `/users` | `GET /users` |

### Маршруты в корне (`routes/root.js`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/` | HTML-страница (`views/index.pug`) |
| `POST` | `/` | `POST /users` |
| `GET` | `/phones` | JSON-массив телефонов |
| `GET` | `/test` | `Hello World!` или `Hello {name}!` (query-параметр `name`) |
| `GET` | `/test/:id` | HTML-страница с заголовком; параметр `:id` проходит через `sanitize-html` |
| `GET` | `/courses` | HTML-список курсов (`views/curses.pug`); опциональный query-параметр `q` для поиска по названию или описанию |
| `GET` | `/courses/:id/lessons/:postId` | `Course ID: {id}; Post ID: {postId}` (plain text) |

### Курсы (`routes/root.js`, `views/curses.pug`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/courses` | Все курсы |
| `GET` | `/courses?q=массивы` | «JS: Массивы» — подстрока есть в названии |
| `GET` | `/courses?q=JavaScript` | Оба курса — подстрока есть в описании |
| `GET` | `/courses?q=функции` | «JS: Функции» — совпадение в названии или описании |
| `GET` | `/courses?q=python` | Пустой список и сообщение «Курсы не найдены» |

Фильтрация работает на сервере: маршрут читает `req.query.q`, ищет подстроку в названии **или** описании курса (без учёта регистра) и передаёт результат в шаблон. На странице одна GET-форма — после отправки браузер открывает `/courses?q=...`, а введённый текст сохраняется в поле ввода.

```javascript
// routes/root.js
const { q = '' } = req.query
const filterQuery = q.trim()
const query = filterQuery.toLowerCase()
const courses = filterQuery
  ? state.courses.filter((course) =>
      course.title.toLowerCase().includes(query)
      || course.description.toLowerCase().includes(query)
    )
  : state.courses
```

```pug
// views/curses.pug — форма отправляет GET-запрос на /courses
form(method="GET" action="/courses")
  input(type="text" name="q" value=filterQuery placeholder="Поиск по названию или описанию")
  button(type="submit") Найти
```

### HTML через Pug (`routes/demo/index.js`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/demo` | HTML-страница из шаблона `views/demo.pug` |

Настройка движка шаблонов — в `plugins/view.js`. В маршруте используется `reply.view('demo', { title, message })`.

### Пользователи (`routes/users/index.js`)

| Метод | URL | Ответ |
|-------|-----|--------|
| `GET` | `/users` | Таблица пользователей (`views/users/index.pug`) |
| `GET` | `/users/:id` | Карточка пользователя или `404` с текстом `User not found` |

Данные генерируются в `lib/getUsers.js` (100 пользователей, фиксированный seed для воспроизводимости).

**Когда что использовать:**

- **`routes/имя.js`** — эндпоинты без общего префикса (главная, `/courses`, `/test` и т.п.).
- **`routes/имя/index.js`** — логическая группа под одним префиксом (`/demo`, `/users`). В папку можно добавлять другие файлы, не раздувая один большой модуль.

Подробнее о соглашениях — в [routes/README.md](routes/README.md).

## Защита от XSS

В приложении используются два уровня защиты.

### 1. Автоэкранирование в Pug

Оператор `=` в шаблонах превращает `<script>` в безопасный текст (`&lt;script&gt;`). Например, в `views/curses.pug`:

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

- [Документация Fastify](https://fastify.dev/docs/latest/)
- [Плагины Fastify](https://fastify.dev/docs/latest/Reference/Plugins/)
- [Маршруты и Promise](https://fastify.dev/docs/latest/Reference/Routes/#promise-resolution)
- [Pug — синтаксис шаблонов](https://pugjs.org/api/getting-started.html)
