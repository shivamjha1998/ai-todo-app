import { Queue, Worker } from 'bullmq';
import { analyzeTask } from '../services/aiService';

// 1. Connection Config (Connects to Docker Redis)
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};

// 2. Define the Queue (Producer)
export const taskQueue = new Queue('ai-analysis-queue', { connection });

// 3. Define the Worker (Consumer)
export const taskWorker = new Worker('ai-analysis-queue', async (job) => {
    console.log(`[Job ${job.id}] Starting Analysis for Task: ${job.data.taskId}`);

    try {
        const { taskId, title, description } = job.data;

        // Call your existing AI service logic here
        const result = await analyzeTask(taskId, title, description);

        console.log(`[Job ${job.id}] Completed`);
        return result;
    } catch (error) {
        console.error(`[Job ${job.id}] Failed`, error);
    }
}, {
    connection,
    concurrency: 2,
    stalledInterval: 10000
});

taskWorker.on('completed', (job) => {
    console.log(`Job ${job.id} finished successfully`);
});
