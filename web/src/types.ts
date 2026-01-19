export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    aiStatus: 'NONE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
    dueDate?: string;
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
