# uuidhash — обзор кодовой базы и внесённый патч

Документ фиксирует состояние проекта, набор изменений (`.dockerignore` + гейт сборки wasm, GA-guard,
bcrypt в Web Worker, `VITE_DEFAULT_LANG`, отдельный wasm-модуль с декодером X.509), способ проверки и
список проблем, которые остались неисправленными.

Дата проверки: 2025-09-25. Все команды выполнялись из корня репозитория.

---

## 1. Назначение и архитектура

Статический SPA-сайт «Local Developer Tools» (`mylocaltools.dev`, зеркало `uuidhash.ru`): набор
инструментов разработчика, где вычисления выполняются в WebAssembly, а React отвечает только за UI.
Заявленный принцип — «данные не покидают браузер».

| Инструмент | Реализация |
|---|---|
| UUID v4 | `uuid` crate, `Uuid::new_v4()` |
| Base64 encode/decode | `base64` crate, STANDARD / URL_SAFE_NO_PAD |
| SHA-1 / SHA-256 / SHA-512 | `sha1`, `sha2`, hex-вывод |
| bcrypt hash / verify | `bcrypt` crate (cost 4–20), теперь в Web Worker |
| JSON format / minify | чистый JS (`JSON.parse` / `JSON.stringify`) |
| X.509 decoder | отдельный wasm-крейт `wasm-crate-x509` (`x509-parser`), только вывод полей |

```
src/components/*  →  src/wasm.ts  →  wasm-crate/pkg/uuidhash_wasm.js  →  uuidhash_wasm_bg.wasm (89 KB)
src/components/X509Section.tsx → src/wasm-x509.ts → import() → wasm-crate-x509/pkg (215 KB, on demand)
src/lib/analytics.ts       — загрузка GA4 (только если VITE_GA_MEASUREMENT_ID задан)
src/lib/bcryptWorker.ts    — клиент воркера: очередь до сигнала готовности, fallback на главный поток
src/workers/bcrypt.worker.ts — синхронный bcrypt вне главного потока
```

- **wasm-ядро**: `wasm-crate/src/lib.rs`, `wasm-bindgen`, `--target bundler`, `vite-plugin-wasm`.
  Случайность UUID берётся из `crypto.getRandomValues` (`getrandom` с `wasm_js` +
  `wasm-crate/.cargo/config.toml`), а не из сети.
- **Роутинг**: `src/App.tsx` — дерево маршрутов без префикса (язык по умолчанию) и `/:lang`;
  `src/main.tsx` нормализует `/uuid/index.html` → `/uuid` для статического хостинга.
- **i18n**: `src/i18n/index.ts` — типобезопасные ключи (`Paths<typeof en>`), интерполяция `{param}`,
  разметка `<b>…</b>`; словари `en.ts` / `ru.ts`, правила русского плюрала.
- **SEO**: `useSEO` (canonical/OG/hreflang), `scripts/generate-seo-files.mjs` (robots.txt, sitemap.xml),
  `scripts/prerender.js` (Puppeteer → `dist/<route>/index.html`).
- **Деплой**: multi-stage `Dockerfile` (Rust + wasm-pack + зависимости Chromium),
  раздача Caddy, `docker-compose.yml`, образ в Yandex Container Registry.

---

## 2. Что изменено в этом патче

### 2.1. Контекст Docker и сборка wasm на чистом клоне

- **`.dockerignore` (новый).** Раньше его не было, а `COPY . .` выполняется после `npm ci`:
  в контекст попадало 273 MB (`node_modules` 125 MB + `wasm-crate/target` 148 MB), а хостовый
  `node_modules` копировался поверх linux-зависимостей из `npm ci` (в нём
  `@esbuild/darwin-arm64`, Chromium Puppeteer для macOS). Теперь исключены `node_modules`,
  `wasm-crate/target`, `wasm-crate/pkg`, `dist`, `.git`, `.env*` (кроме `.env.example`), `docs`.
- **`scripts/ensure-wasm.mjs` + `predev` (новые).** `wasm-crate/pkg` не хранится в git
  (`wasm-crate/pkg/.gitignore` = `*`), а `dev` = просто `vite` — свежий клон падал на импорте
  `../wasm-crate/pkg/uuidhash_wasm.js`. Хук `predev` вызывает гейт: если `uuidhash_wasm_bg.wasm`
  есть — выход за миллисекунды, если нет — однократный `npm run wasm` с понятным сообщением
  об отсутствии Rust/wasm-pack. `prepare` сознательно не используется: он запускался бы и в
  Docker-стадии с `npm ci`.

### 2.2. GA-guard: убрана подстановка плейсхолдера в HTML

Проблема: `index.html` читал `const gaId = '%VITE_GA_MEASUREMENT_ID%'`. Vite подставляет только
**определённые** переменные; для неопределённой он оставляет плейсхолдер как есть, строка truthy →
страница всё равно обращалась к `googletagmanager.com`. Это противоречило тексту в UI
(«без трекинга, без сетевых запросов») и футеру.

- `index.html` — инлайновый блок GA удалён.
- `src/lib/analytics.ts` (новый) — `loadAnalytics()` читает `import.meta.env.VITE_GA_MEASUREMENT_ID`
  (там неопределённая переменная — это `undefined`, строка-плейсхолдер появиться не может),
  грузит скрипт после `load`, модульный флаг защищает от повторной инъекции при SPA-навигации.
- `src/hooks/useAnalytics.ts` — вызывает `loadAnalytics()` и оставляет per-route `gtag('config')`.
- `vite.config.ts` — сборка падает, если не задан `VITE_SITE_URL` (иначе плейсхолдеры
  `%VITE_SITE_URL%` уезжали в canonical/og:url), и если `VITE_DEFAULT_LANG` не из списка языков.

Проверено пробным билдом Vite: при неопределённой переменной плейсхолдер остаётся в HTML буквально
(Vite только предупреждает) — то есть исходный дефект был реальным.

### 2.3. bcrypt в Web Worker (и найденный при этом баг)

Синхронный wasm-bcrypt блокировал главный поток: при cost 20 вкладка «умирала» на десятки секунд,
а состояние «Hashing…» не успевало отрисоваться (`async`-обработчик не помогал).

- `src/workers/bcrypt.worker.ts` (новый) — hash/verify в отдельном воркере.
- `src/lib/bcryptWorker.ts` (новый) — клиент: очередь задач, handshake готовности, таймаут-страховка
  и fallback на главный поток, если браузер не создаёт module worker.
- `src/components/BcryptSection.tsx` — переход на `bcryptHash` / `bcryptVerify`, добавлено
  отображение ошибки во вкладке Verify.
- `vite.config.ts` — `worker: { format: 'es', plugins: () => [wasm()] }`. Воркерный бандл
  собирается со своим списком плагинов, поэтому `vite-plugin-wasm` нужно регистрировать повторно,
  иначе сборка падает с «ESM integration proposal for Wasm is not supported currently».

**Отдельный баг, найденный e2e-тестом:** первая версия воркера назначала `onmessage` после
статического импорта `../wasm`, который раскрывается в top-level await (загрузка и инстанцирование
wasm). Сообщение, отправленное в этот промежуток, **теряется** — воркер его не получает, промис не
разрешается, UI навсегда остаётся в «Hashing…». Симптом воспроизводился на RU-сборке 3 раза из 3
(в отладке видно «worker module evaluated, onmessage assigned» без «worker got message»), на
EN-сборке — реже, то есть это гонка, а не детерминированный отказ. Исправление: воркер после
назначения обработчика посылает `{ ready: true }`, клиент буферизует задачи до этого сигнала.

### 2.4. `VITE_DEFAULT_LANG`

- `src/i18n/index.ts` — язык по умолчанию из env с проверкой значения (`isLang`), а не «как есть».
- `src/vite-env.d.ts` — типизация `VITE_DEFAULT_LANG?: 'en' | 'ru'`.
- `src/hooks/useSEO.ts` — `x-default` теперь указывает на язык по умолчанию, а не на `LANGS[0]`.
- `scripts/prerender.js` — язык по умолчанию через `loadEnv`, префикс получают только не-дефолтные
  языки (иначе при `VITE_DEFAULT_LANG=ru` пре-рендер расходился с приложением).
- `scripts/generate-seo-files.mjs` — то же правило для sitemap: `loc`, `x-default`, priority и
  сортировка (дефолтные страницы первыми) считаются от дефолтного языка.
- `.env.example` — переменная задокументирована; `.env.rus` — `VITE_DEFAULT_LANG=ru`.
- `Dockerfile` — `ARG`/`ENV VITE_DEFAULT_LANG` (по умолчанию `en`); `docker-compose.yml` — проброс
  `VITE_DEFAULT_LANG=${VITE_DEFAULT_LANG:-en}`.

### 2.5. E2E-проверка

`scripts/verify-e2e.mjs` (новый) + `npm run verify:e2e`: поднимает `dist` с тем же правилом
fallback, что в Caddyfile (`try_files {path} {path}/index.html /index.html`), и в реальном Chromium
прогоняет все инструменты, проверяет работу bcrypt в воркере, отзывчивость главного потока,
отсутствие/наличие запроса к GA и пре-рендер без JavaScript. GA блокируется через CDP
(`Network.setBlockedURLs`), а не через `page.setRequestInterception`: Fetch-перехват вешает запросы
самого воркера за wasm, и воркер не стартует.

### 2.6. Декодер сертификатов X.509 (отдельный wasm-модуль)

Инструмент выводит только поля сертификата (в стиле `openssl x509 -text`); подпись, цепочка и отзыв
сознательно не проверяются — иначе пришлось бы тянуть `ring`/`aws-lc-rs` (не собираются под wasm32) и
сеть (OCSP/CRL), что противоречит обещанию «без сетевых запросов».

- **`wasm-crate-x509/`** — новый крейт: `x509-parser 0.18` (без фич `verify`), `sha1`/`sha2` для
  отпечатков, `base64` для вывода PEM. Профиль заточен под размер (`opt-level="z"`, `lto`,
  `codegen-units=1`, `strip`, `panic="abort"`) плюс
  `[package.metadata.wasm-pack.profile.release] wasm-opt = ["-Oz", "--enable-bulk-memory"]` —
  rustc генерирует bulk-memory инструкции, и без этого флага wasm-opt отказывается валидировать модуль.
  **Итог: 215 523 B (82 557 B gzip)** при согласованном бюджете 400–600 KB.
- `x509_describe(input: &[u8])` принимает PEM (в том числе бандл из нескольких сертификатов), «голый»
  base64 или DER и отдаёт JSON: DN субъекта/издателя списком `{abbr,value}`, поля (версия, серийный
  номер, алгоритмы, сроки, тип и размер ключа, экспонента RSA, отпечатки SHA-1/SHA-256, PEM) и
  расширения. Моделируются `subjectAltName`, `keyUsage`, `extendedKeyUsage`, `basicConstraints`,
  `subjectKeyIdentifier`, `authorityKeyIdentifier`; остальные отдаются сырым DER в hex — как openssl
  печатает незнакомые расширения.
- Ошибки — стабильные коды (`empty_input`, `input_too_large`, `invalid_pem`, `invalid_certificate`),
  а не текст парсера: UI переводит их (`src/wasm-x509.ts` → `X509ParseError` → словари). Разбор вынесен
  в `describe_input`, потому что `JsValue::from_str` паникует вне wasm и делал бы ветки ошибок
  нетестируемыми.
- **Ленивая загрузка**: `src/wasm-x509.ts` подключает модуль через `import()`, поэтому Vite выносит его
  в отдельные чанки — `uuidhash_x509_wasm-*.js` (1.9 KB) и `uuidhash_x509_wasm_bg-*.wasm` (215 KB),
  которых нет в графе загрузки остальных страниц. Входной бандл вырос на ~10 KB (секция, i18n, стили).
- Фикстуры для тестов крейта: `wasm-crate-x509/fixtures/cert.pem` (самоподписанный с SAN, keyUsage,
  EKU, basicConstraints и неподдерживаемым `certificatePolicies` — чтобы работал hex-фолбэк) и
  `chain.pem` (он же + реальный корневой CA из системного бандла).

### 2.7. Список файлов

| Файл | Изменение |
|---|---|
| `.dockerignore` | новый |
| `scripts/ensure-wasm.mjs` | новый, гейт сборки wasm |
| `scripts/verify-e2e.mjs` | новый, e2e-проверка |
| `src/lib/analytics.ts` | новый, загрузка GA4 |
| `src/lib/bcryptWorker.ts`, `src/workers/bcrypt.worker.ts` | новые, bcrypt в воркере |
| `package.json` | `ensure:wasm`, `predev`, `verify:e2e` |
| `index.html` | удалён инлайновый GA-блок |
| `vite.config.ts` | валидация env, `worker.plugins`/`format` |
| `src/hooks/useAnalytics.ts`, `src/hooks/useSEO.ts` | GA-загрузчик, `x-default` |
| `src/i18n/index.ts`, `src/vite-env.d.ts` | `VITE_DEFAULT_LANG` |
| `src/components/BcryptSection.tsx` | async API воркера, ошибка verify |
| `scripts/prerender.js`, `scripts/generate-seo-files.mjs` | дефолтный язык |
| `Dockerfile`, `docker-compose.yml`, `.env.example`, `.env.rus` | проброс/документация переменной |
| `wasm-crate-x509/` (Cargo.toml, src/lib.rs, fixtures/) | новый крейт: разбор сертификатов X.509 |
| `src/wasm-x509.ts`, `src/components/X509Section.tsx` | ленивая загрузка модуля и UI декодера |
| `src/App.tsx`, `src/components/Layout.tsx`, `src/components/Home.tsx` | маршрут, пункт меню, карточка |
| `src/i18n/en.ts`, `src/i18n/ru.ts`, `src/index.css` | словари и стили инструмента |
| `package.json`, `scripts/ensure-wasm.mjs`, `.dockerignore` | сборка обоих крейтов |

---

## 3. Как проверено

### 3.1. Статические проверки

| Команда | Результат |
|---|---|
| `npx tsc --noEmit` | чисто, exit 0 |
| `cargo test` (`wasm-crate`) | 5/5 passed |
| `cargo test` (`wasm-crate-x509`) | 5/5 passed (PEM, base64, DER, бандл, коды ошибок) |
| `npx vite build` | entry 210.6 KB (gzip 68.1), CSS 12.4 KB, `uuidhash_wasm_bg` 89 KB, воркер 3.9 KB, **ленивые** `uuidhash_x509_wasm` 1.9 KB + `uuidhash_x509_wasm_bg` 215.5 KB (82.6 KB gzip) |
| `npm run seo`, `npm run prerender` | 14 маршрутов, robots.txt + sitemap.xml (включён `/x509` и `/ru/x509`) |
| `npm run dev -- --version` | `predev` → `ensure:wasm` → `dev` (хук подключён) |
| `npm run ensure:wasm` без `pkg` | запускает `npm run wasm`, при неудаче — понятное сообщение, exit 1 |
| `npx vite build` без `VITE_SITE_URL` | падает: «VITE_SITE_URL is not set…» |
| `VITE_DEFAULT_LANG=de npx vite build` | падает: «VITE_DEFAULT_LANG="de" is not supported…» |

### 3.2. E2E-матрица (`npm run verify:e2e`)

| Конфигурация сборки | Результат |
|---|---|
| EN: `VITE_DEFAULT_LANG=en`, GA-ID задан | **20/20**, GA-запрос attempted, `maxGap=17ms` при `elapsed=1144ms` |
| RU / GA-off: `VITE_DEFAULT_LANG=ru`, GA-ID не задан | **20/20**, 0 запросов к GA, `maxGap=17ms` при `elapsed=1146ms` |

Что проверяет каждый пункт: пре-рендер без JS (`/uuid` и `/x509`), UUID v4 по формату, отсутствие
повторной инъекции GA при клиентской навигации, SHA-256("abc") = известный дайджест, Base64
round-trip, форматирование JSON, bcrypt-хеш cost 14 в воркере, отзывчивость главного потока,
verify совпадающего пароля, политика GA, отсутствие необработанных ошибок, а для X.509 — что модуль
не загружается до первого использования, что после использования загружены оба его ассета, что
subject/расширения/отпечаток SHA-256 совпадают с эталоном `node:crypto`, что бандл из двух
сертификатов разбирается целиком и что мусорный ввод даёт локализованную ошибку без внутренностей
парсера.

Ключевая метрика отзывчивости: при хешировании cost 14 (~1.1 s работы) максимальный разрыв между
кадрами rAF составил 17–19 ms. При выполнении на главном потоке разрыв был бы равен длительности
хеша.

### 3.3. Разовые пробы (не остались в репозитории)

- Base64, движок `base64` 0.22 напрямую: `URL_SAFE_NO_PAD` отвергает padded-вход
  (`aGVsbG8=` → `InvalidPadding`), STANDARD отвергает unpadded, пробел/перенос → `InvalidByte`.
- Ветки ошибок wasm нативно не тестируются: `JsValue::from_str` паникует вне wasm
  («function not implemented on non-wasm32 targets») — для них нужен `wasm-bindgen-test`.

---

## 4. Найденное, но не исправленное

### Высокий приоритет

1. **Строгость Base64 и сырые ошибки Rust в UI** — `wasm-crate/src/lib.rs:22-37`. URL-safe режим
   отвергает padded-строки, standard — unpadded, любой whitespace ломает декодирование; в UI
   попадает текст вида `Base64 decode error: Invalid padding` без локализации. В новом X.509-модуле
   этот паттерн уже исправлен (стабильные коды ошибок + словари) — его стоит распространить на
   base64 и bcrypt.
2. **`bcrypt_verify` глотает ошибки** — `lib.rs:68-70` + `BcryptSection.tsx`. Мусорный хеш
   трактуется как «пароль не совпадает»; формат хеша не валидируется.
3. **`.env.rus` хранится в git** (GA-ID, домен), тогда как `.env` игнорируется. Стоит игнорировать
   `.env.*` кроме `.env.example`.

### Средний приоритет

4. **Хардкод абсолютных путей** `/Users/kn/devel/uuidhash/dist` в `scripts/diag-stack.mjs:6` и
   `scripts/diag-prerender.mjs:6` — не переносимо.
5. **Caddy без сжатия и кэш-заголовков** — нет `encode`, нет `Cache-Control: immutable` для
   хэшированных `assets/*`, нет security-заголовков.
6. **Нет CI, линтера и тестов фронтенда** — только 5 Rust-тестов; ESLint отсутствует, поэтому
   ошибки вида отсутствующих зависимостей в `useCallback` не ловятся.
7. **Нет README** — новый разработчик не узнает про `npm run wasm`, env-переменные и
   `build:prerender` иначе как из этого документа.

### Низкий приоритет

8. `JsonSection.tsx:49-62` — в `useCallback` нет зависимости `t`: после смены языка текст ошибки
   остаётся на прежнем языке.
9. `Home.tsx:24-37` — `useEffect` без массива зависимостей пересоздаёт JSON-LD на каждый рендер.
10. `CopyButton.tsx:15` — `navigator.clipboard` без `.catch` и фолбэка: на несекьюрном origin
    копирование молча не работает.
11. `UuidSection.tsx:19-21` — эффект с пустыми зависимостями и StrictMode дают двойную генерацию.
12. **Нет code splitting** — все разделы в одном чанке 200 KB; уместен `React.lazy` по маршрутам.
13. `docker-compose.yml` — устаревший `version: "3.8"`, `platform: linux/amd64` форсирует
    эмуляцию на Apple Silicon.
14. `vite.config.ts` — `server.host: true` открывает dev-сервер в локальную сеть (оставлено
    как было; пустой блок `preview: {}` удалён).

---

## 5. Ограничения окружения и известные особенности

- **`npm run wasm` не проходит в этой песочнице.** `wasm-pack 0.13.1` компилирует крейт и вызывает
  `wasm-bindgen`, после чего падает на шаге `wasm-opt`: `Operation not permitted (os error 1)`.
  Сам бинарник `wasm-opt` (version 117, `~/Library/Caches/.wasm-pack/...`) запускается вручную
  нормально (`wasm-opt -O` воспроизводит прежний размер 89 056 B), поэтому причина — ограничения
  запуска внешних процессов, а не код проекта. Обходные пути: собирать вне песочницы либо
  добавить `[package.metadata.wasm-pack.profile.release] wasm-opt = false` (как предлагает сам
  wasm-pack) — тогда wasm будет ~107 KB вместо 89 KB. Оптимизированный артефакт восстановлен.
  Для `wasm-crate-x509` `pkg/` собран вручную тем же конвейером, что и wasm-pack:
  `cargo build --target wasm32-unknown-unknown --release` →
  `wasm-bindgen --target bundler --out-dir pkg <wasm>` (CLI 0.2.126 из кеша wasm-pack, версия
  зафиксирована в `wasm-crate-x509/Cargo.lock`) → `wasm-opt -Oz --enable-bulk-memory`. На обычной
  машине всё это делает `npm run wasm` (`wasm-pack`), которому флаги `wasm-opt` передаются из
  `Cargo.toml`.
- **Размер X.509-модуля**: 215 523 B raw / 82 557 B gzip при согласованном бюджете 400–600 KB.
  Замеры по пути (были сделаны на прототипе): наивный прототип с `serde_json` и `{:?}` — 526 KB,
  экономный без них — 417 KB, итоговый с `opt-level="z"`/`lto`/`strip` и `-Oz` — 215 KB.
- При `VITE_DEFAULT_LANG=ru` страница `/ru/...` остаётся доступной как дубль неперефиксированной:
  canonical с неё указывает на `/...`, так что для поисковиков это не проблема, но редирект
  (в `LangParamGate`) не добавлялся — вне объёма патча.
- Запрос к GA выполняется один раз на полную загрузку страницы (проверено: 5 навигаций → 5
  запросов, клиентская навигация повторной инъекции не вызывает).
- `dist/` — артефакт сборки (в git его нет). Текущее содержимое — EN-сборка с пре-рендером,
  `robots.txt` и `sitemap.xml` от `https://mylocaltools.dev`.
