export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    aiStatus: 'NONE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
    dueDate: string | null;
    createdAt: string;
    threads?: AiThread[];
}

export interface AiThread {
    id: string;
    type: 'AUTO_SUGGESTION' | 'USER_QUESTION' | 'AI_ANSWER';
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    createdAt: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
}

export interface User {
    id: string;
    email: string;
    name: string | null;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    name: string;
}

export interface UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}
