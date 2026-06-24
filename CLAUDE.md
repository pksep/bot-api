# @pksep/bot-api — Правила для LLM-агентов

## Рантайм и пакетный менеджер

- Используй **bun** вместо npm/node (`bun install`, `bun run`, `bunx`)

## Стиль кода

- TypeScript strict mode — без `any`, без `as any`
- Все публичные методы — с JSDoc и `@example`
- Все catch блоки — `catch (err: unknown)` с proper error mapping
- Ошибки API → `ApiError`, сети → `SepBotError`, polling → `PollingError`
- Параметры методов — простые аргументы (chatId, text), не объекты
- Optional params — через `options?` объект последним аргументом

## Архитектура

- Библиотека без зависимостей (только `fetch` из Node.js 18+)
- `SepBot` — единственная точка входа для пользователя
- `ApiClient` — low-level HTTP, не экспортируется в типичном use-case
- `PollingManager` — внутренний, управляется через `bot.startPolling()`

## Документация

После изменений обновить:
- README.md — API Reference, Examples
- JSDoc на изменённых методах
- examples/ — если добавлен новый метод
