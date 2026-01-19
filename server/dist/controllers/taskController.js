"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTask = exports.createTask = exports.getTasks = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const aiService_1 = require("../services/aiService");
const getTasks = async (req, res) => {
    try {
        const tasks = await prisma_1.default.task.findMany({
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
        const { title, description, priority, dueDate, userId } = req.body;
        // Create task
        const task = await prisma_1.default.task.create({
            data: {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'PENDING',
                userId: userId // TODO: Replace with actual user ID from auth middleware
            }
        });
        // Trigger AI Analysis Job (Background)
        // In a real production app, this should be handled by a queue (Bull)
        // For MVP, we can just call it asynchronously without awaiting
        (0, aiService_1.analyzeTask)(task.id, task.title, task.description).catch(err => {
            console.error('AI Analysis Trigger Failed:', err);
        });
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
        const task = await prisma_1.default.task.findUnique({
            where: { id: String(id) },
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
        const { title, description, status, priority, dueDate } = req.body;
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
        await prisma_1.default.task.delete({ where: { id: String(id) } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
exports.deleteTask = deleteTask;
