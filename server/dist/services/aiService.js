"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUserQuery = exports.analyzeTask = void 0;
const inference_1 = require("@huggingface/inference");
const prisma_1 = __importDefault(require("../prisma"));
const hf = new inference_1.InferenceClient(process.env.HUGGINGFACE_API_KEY);
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
        const response = await hf.chatCompletion({
            model: "meta-llama/Llama-3.2-3B-Instruct",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 1024
        });
        const aiResponse = response.choices[0].message.content || '';
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
        // We don't throw here to ensure the task creation doesn't fail just because AI failed
    }
};
exports.analyzeTask = analyzeTask;
const processUserQuery = async (taskId, question) => {
    try {
        // 1. Fetch task details for context
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            include: { threads: true } // Optional: Include past history for better context
        });
        if (!task)
            throw new Error('Task not found');
        // 2. Save User's Question to Database
        await prisma_1.default.aiThread.create({
            data: {
                taskId,
                type: 'USER_QUESTION', // Matches enum in schema
                role: 'USER',
                content: question
            }
        });
        // 3. Construct Context-Aware Prompt
        const systemPrompt = `
      You are a helpful AI assistant for a Todo App.
      Context Task: "${task.title}"
      Description: "${task.description || 'N/A'}"

      Answer the user's question specifically related to this task.
      Keep it concise and actionable.
    `;
        // 4. Call Hugging Face API
        const response = await hf.chatCompletion({
            model: "meta-llama/Llama-3.2-3B-Instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question }
            ],
            max_tokens: 500
        });
        const aiResponse = response.choices[0].message.content || 'I could not generate a response.';
        // 5. Save AI's Answer to Database
        const savedThread = await prisma_1.default.aiThread.create({
            data: {
                taskId,
                type: 'AI_ANSWER', // Matches enum in schema
                role: 'ASSISTANT',
                content: aiResponse
            }
        });
        return savedThread;
    }
    catch (error) {
        console.error('AI Query Failed:', error);
        throw error;
    }
};
exports.processUserQuery = processUserQuery;
