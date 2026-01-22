import { Response } from 'express';
import prisma from '../prisma';
import { processUserQuery } from '../services/aiService';
import { taskQueue } from '../queue/taskQueue';
import { AuthRequest } from '../middleware/auth';

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const tasks = await prisma.task.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { threads: true }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, priority, dueDate } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Create task
        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'PENDING',
                aiStatus: 'PROCESSING',
                userId
            }
        });

        await taskQueue.add('analyse-task', {
            taskId: task.id,
            title: task.title,
            description: task.description
        });
        console.log(`Task ${task.id} queued for analysis`);

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const getTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const task = await prisma.task.findFirst({
            where: {
                id: String(id),
                userId
            },
            include: { threads: true }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { title, description, status, priority, dueDate } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const existingTask = await prisma.task.findFirst({
            where: { id: String(id), userId }
        });

        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const task = await prisma.task.update({
            where: { id: String(id) },
            data: {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined
            }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Check ownership
        const existingTask = await prisma.task.findFirst({
            where: { id: String(id), userId }
        });

        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await prisma.task.delete({ where: { id: String(id) } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

export const submitQuery = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { question } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Check ownership
        const existingTask = await prisma.task.findFirst({
            where: { id: String(id), userId }
        });

        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const newThread = await processUserQuery(id, question);

        res.status(201).json(newThread);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process query' });
    }
};
