# AI-Powered Todo App

An intelligent task management application that leverages LLMs to automatically analyze tasks, suggest execution steps, and manage context.

## Features

- **AI Auto-Assist**: Automatically analyzes tasks to suggest actionable steps.
- **Task Management**: Create, edit, delete, and prioritize tasks.
- **Smart Context**: AI remembers context from previous interactions.
- **Real-time Updates**: Live updates for task status and AI responses.

## Tech Stack

- **Frontend**: React, Vite, Bootstrap 5
- **Backend**: Node.js, Express, PostgreSQL, Prisma, Redis, Bull
- **AI**: Hugging Face Inference API

## Getting Started

### 1. Database
Start the PostgreSQL database using Docker:
```bash
docker compose up -d
```

### 2. Backend
Navigate to the server directory, install dependencies, and start the server:
```bash
cd server
npm install
npx prisma generate
npm run dev
```

### 3. Mobile (Frontend)
Navigate to the server directory, install dependencies, and start the server:
```bash
cd mobile
npm install
npx expo run
```

### 4. Web (Frontend)
Navigate to the web directory, install dependencies, and start the application:
```bash
cd web
npm install
npm run dev
```
