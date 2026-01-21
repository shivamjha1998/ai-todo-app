"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskWorker = exports.taskQueue = void 0;
const bullmq_1 = require("bullmq");
const aiService_1 = require("../services/aiService");
// 1. Connection Config (Connects to Docker Redis)
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};
// 2. Define the Queue (Producer)
exports.taskQueue = new bullmq_1.Queue('ai-analysis-queue', { connection });
// 3. Define the Worker (Consumer)
exports.taskWorker = new bullmq_1.Worker('ai-analysis-queue', async (job) => {
    console.log(`[Job ${job.id}] Starting Analysis for Task: ${job.data.taskId}`);
    try {
        const { taskId, title, description } = job.data;
        // Call your existing AI service logic here
        const result = await (0, aiService_1.analyzeTask)(taskId, title, description);
        console.log(`[Job ${job.id}] Completed`);
        return result;
    }
    catch (error) {
        console.error(`[Job ${job.id}] Failed`, error);
    }
}, {
    connection,
    concurrency: 10,
    stalledInterval: 10000
});
exports.taskWorker.on('completed', (job) => {
    console.log(`Job ${job.id} finished successfully`);
});
