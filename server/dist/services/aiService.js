"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTask = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const prisma_1 = __importDefault(require("../prisma"));
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY, // ensure this is set in .env
});
const analyzeTask = async (taskId, taskTitle, taskDescription) => {
    try {
        // 1. Update task AI status to PROCESSING
        await prisma_1.default.task.update({
            where: { id: taskId },
            data: { aiStatus: 'PROCESSING' }
        });
        const prompt = `
      Analyze the following task and provide actionable steps to complete it.
      Also list any pre-requisites or things to check before starting.
      
      Task: ${taskTitle}
      Description: ${taskDescription || 'No description provided.'}
      
      Format your response as a clear, structured list.
    `;
        const message = await anthropic.messages.create({
            model: 'claude-3-opus-20240229', // or claude-3-sonnet-20240229 for speed/cost
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });
        const aiResponse = message.content[0].type === 'text' ? message.content[0].text : '';
        // 2. Save response as a thread
        await prisma_1.default.aiThread.create({
            data: {
                taskId,
                type: 'AUTO_SUGGESTION',
                role: 'ASSISTANT',
                content: aiResponse
            }
        });
        // 3. Update task AI status to COMPLETED
        await prisma_1.default.task.update({
            where: { id: taskId },
            data: { aiStatus: 'COMPLETED' }
        });
        return aiResponse;
    }
    catch (error) {
        console.error('AI Analysis Failed:', error);
        await prisma_1.default.task.update({
            where: { id: taskId },
            data: { aiStatus: 'ERROR' }
        });
        throw error;
    }
};
exports.analyzeTask = analyzeTask;
