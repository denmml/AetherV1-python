# Aether PKM — Frontend

React + Vite + Tailwind CSS приложение для управления графом знаний.

## Быстрый старт

```bash
cd frontend
npm install        # или pnpm install
npm run dev        # http://localhost:5173
```

Backend должен работать на `http://localhost:8000`.  
Vite проксирует `/api` → `http://localhost:8000`.

## Структура

```
src/
├── api.js                    # Все HTTP-клиенты (axios)
├── App.jsx                   # Роутинг + AuthProvider
├── main.jsx                  # Точка входа
├── index.css                 # Tailwind base
├── context/
│   └── AuthContext.jsx       # Глобальное состояние auth
├── components/
│   ├── KnowledgeGraph.jsx    # Граф на React Flow
│   ├── Recorder.jsx          # Диктофон + Whisper
│   └── Layout.jsx            # Sidebar навигация
└── pages/
    ├── LoginPage.jsx
    ├── GraphPage.jsx
    └── RecorderPage.jsx
```
