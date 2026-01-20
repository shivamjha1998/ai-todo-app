import { Request, Response } from 'express';
import prisma from '../prisma';
import { analyzeTask, processUserQuery } from '../services/aiService';
import { getOrCreateDefaultUser } from '../services/userService';
import { taskQueue } from '../queue/taskQueue';

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
                aiStatus: 'PROCESSING',
                userId: finalUserId
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

export const submitQuery = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const newThread = await processUserQuery(id, question);

        res.status(201).json(newThread);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process query' });
    }
};
