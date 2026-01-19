import axios from 'axios';
import type { Task, CreateTaskDto } from '../types';

const API_URL = 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
});

export const fetchTasks = async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data;
};

export const createTask = async (task: CreateTaskDto): Promise<Task> => {
    const response = await api.post('/tasks', task);
    return response.data;
};

export const getTask = async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, updates);
    return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
};
