import type {
    Task,
    CreateTaskDto,
    UpdateTaskDto,
    LoginDto,
    RegisterDto,
    AuthResponse
} from '../types';

const BASE_URL = 'http://localhost:3001';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

// --- AUTH API ---

export const login = async (data: LoginDto): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }
    return response.json();
};

export const register = async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    return response.json();
};

// --- TASK API ---

export const fetchTasks = async (): Promise<Task[]> => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        headers: getAuthHeaders(),
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.reload();
        throw new Error('Unauthorized');
    }
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
};

export const createTask = async (task: CreateTaskDto): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
};

export const updateTask = async (id: string, updates: Partial<UpdateTaskDto>): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
};

export const deleteTask = async (id: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete task');
};

export const getTask = async (id: string): Promise<Task> => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
};

export const postQuery = async (taskId: string, question: string) => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ question }),
    });
    if (!response.ok) throw new Error('Failed to send query');
    return response.json();
};
