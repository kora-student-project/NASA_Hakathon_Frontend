# KORA Dashboard

React + Vite + TypeScript. Карта (Leaflet + OpenStreetMap, безкоштовно, без ключів), статус об'єктів, графік нахилу (Recharts) та попередження. Дані оновлюються кожні 15 с.

## Запуск

Потрібен Node.js 20+ і запущений бекенд.

```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:8000
npm run dev
```

Відкрийте <http://localhost:5173>. У `CORS_ORIGINS` бекенду має бути ця адреса.

## Що показує

- **Карта:** маркери об'єктів кольором статусу (зелений NORMAL, жовтий WARNING, червоний CRITICAL, сірий UNKNOWN) + фіолетові точки супутникових спостережень (`/api/satellite/map`).
- **Панель об'єкта:** нахил X/Y, температура, зміщення NISAR, кількість активних попереджень (`/api/objects/{id}/status`).
- **Графік нахилу** по датчику за 1 год / 24 год / 7 днів / усе.
- **Попередження** з фільтром за рівнем. Кнопка «Вирішено» працює після введення admin-ключа у верхньому полі. Ключ зберігається лише в пам'яті сторінки (не в localStorage і не в збірці).

## Деплой на Vercel (free)

1. Vercel → Add New Project → імпортуйте репозиторій.
2. **Root Directory:** `frontend`. Framework — Vite (визначиться автоматично).
3. Environment Variable: `VITE_API_URL` = адреса бекенду на Render (без слеша в кінці).
4. Після деплою додайте адресу Vercel у `CORS_ORIGINS` бекенду на Render і перезапустіть його.

> Усе, що в змінних `VITE_*`, потрапляє у публічну збірку. Не кладіть туди секрети.
