import { Request, Response } from 'express';
import prisma from '../prisma';
import { analyzeTask } from '../services/aiService';
import { getOrCreateDefaultUser } from '../services/userService';

export const getTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: 'desc' },
            include: { threads: true }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, description, priority, dueDate, userId } = req.body;

        // For MVP: Use default user if not provided
        let finalUserId = userId;
        if (!finalUserId) {
            const user = await getOrCreateDefaultUser();
            finalUserId = user.id;
        }

        // Create task
        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'PENDING',
                userId: finalUserId
            }
        });

        // Trigger AI Analysis Job (Background)
        // In a real production app, this should be handled by a queue (Bull)
        // For MVP, we can just call it asynchronously without awaiting
        analyzeTask(task.id, task.title, task.description).catch(err => {
            console.error('AI Analysis Trigger Failed:', err);
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const getTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({
            where: { id: String(id) },
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

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, dueDate } = req.body;

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

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id: String(id) } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
