"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuery = exports.deleteTask = exports.updateTask = exports.getTask = exports.createTask = exports.getTasks = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const aiService_1 = require("../services/aiService");
const taskQueue_1 = require("../queue/taskQueue");
const getTasks = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const tasks = await prisma_1.default.task.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { threads: true }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Create task
        const task = await prisma_1.default.task.create({
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
        await taskQueue_1.taskQueue.add('analyse-task', {
            taskId: task.id,
            title: task.title,
            description: task.description
        });
        console.log(`Task ${task.id} queued for analysis`);
        res.status(201).json(task);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};
exports.createTask = createTask;
const getTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const task = await prisma_1.default.task.findFirst({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
};
exports.getTask = getTask;
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { title, description, status, priority, dueDate } = req.body;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const existingTask = await prisma_1.default.task.findFirst({
            where: { id: String(id), userId }
        });
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const task = await prisma_1.default.task.update({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Check ownership
        const existingTask = await prisma_1.default.task.findFirst({
            where: { id: String(id), userId }
        });
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await prisma_1.default.task.delete({ where: { id: String(id) } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
exports.deleteTask = deleteTask;
const submitQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const { question } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }
        // Check ownership
        const existingTask = await prisma_1.default.task.findFirst({
            where: { id: String(id), userId }
        });
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const newThread = await (0, aiService_1.processUserQuery)(id, question);
        res.status(201).json(newThread);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process query' });
    }
};
exports.submitQuery = submitQuery;
