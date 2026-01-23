# AI-Powered Todo App

An intelligent task management application that leverages LLMs to automatically analyze tasks, suggest execution steps, and manage context.

## Features

- **AI Auto-Assist**: Automatically analyzes tasks to suggest actionable steps.
- **Task Management**: Create, edit, delete, and prioritize tasks.
- **Smart Context**: AI remembers context from previous interactions.
- **Real-time Updates**: Live updates for task status and AI responses.

## Tech Stack

- **Frontend (Web)**: React, Vite, Bootstrap 5 (Neo-Brutalist Design)
- **Frontend (Mobile)**: React Native, Expo
- **Backend**: Node.js, Express, PostgreSQL, Prisma, Redis, Bull
- **AI**: Hugging Face Inference API (Llama-3.2-3B-Instruct)

## Prerequisites

- Node.js
- Docker (for database)
- Expo Go (for mobile testing)

## Environment Setup

Create a `.env` file in the `server` directory with the following variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/todo_db"
JWT_SECRET="your-secret-key"
HF_API_KEY="your-hugging-face-api-key"
```

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

### 3. Mobile App
Navigate to the mobile directory, install dependencies, and start the Expo server:
```bash
cd mobile
npm install
npx expo start
```

### 4. Web (Frontend)
Navigate to the web directory, install dependencies, and start the application:
```bash
cd web
npm install
npm run dev
```
