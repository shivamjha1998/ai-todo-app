import axios from 'axios';
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
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Login failed');
    }
};

export const register = async (data: RegisterDto): Promise<AuthResponse> => {
    try {
        const response = await axios.post(`${BASE_URL}/auth/register`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Registration failed');
    }
};

// --- TASK API ---

export const fetchTasks = async (): Promise<Task[]> => {
    try {
        const headers = getAuthHeaders();
        const response = await axios.get(`${BASE_URL}/tasks`, { headers });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.reload();
            throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch tasks');
    }
};

export const createTask = async (task: CreateTaskDto): Promise<Task> => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/tasks`, task, { headers });
    return response.data;
};

export const updateTask = async (id: string, updates: Partial<UpdateTaskDto>): Promise<Task> => {
    const headers = getAuthHeaders();
    const response = await axios.patch(`${BASE_URL}/tasks/${id}`, updates, { headers });
    return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
    const headers = getAuthHeaders();
    await axios.delete(`${BASE_URL}/tasks/${id}`, { headers });
};

export const getTask = async (id: string): Promise<Task> => {
    const headers = getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/tasks/${id}`, { headers });
    return response.data;
};

export const postQuery = async (taskId: string, question: string) => {
    const headers = getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/tasks/${taskId}/query`, { question }, { headers });
    return response.data;
};
