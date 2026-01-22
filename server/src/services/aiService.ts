import { InferenceClient } from '@huggingface/inference';
import prisma from '../prisma';

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

export const analyzeTask = async (taskId: string, taskTitle: string, taskDescription?: string | null) => {
    try {
        // 1. Update task AI status to PROCESSING
        await prisma.task.update({
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
        await prisma.aiThread.create({
            data: {
                taskId,
                type: 'AUTO_SUGGESTION',
                role: 'ASSISTANT',
                content: aiResponse
            }
        });

        // 3. Update task AI status to COMPLETED
        await prisma.task.update({
            where: { id: taskId },
            data: { aiStatus: 'COMPLETED' }
        });

        return aiResponse;

    } catch (error) {
        console.error('AI Analysis Failed:', error);
        await prisma.task.update({
            where: { id: taskId },
            data: { aiStatus: 'ERROR' }
        });
    }
};

export const processUserQuery = async (taskId: string, question: string) => {
    try {
        // 1. Fetch task details for context
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { threads: true }
        });

        if (!task) throw new Error('Task not found');

        // 2. Save User's Question to Database
        await prisma.aiThread.create({
            data: {
                taskId,
                type: 'USER_QUESTION',
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
        const savedThread = await prisma.aiThread.create({
            data: {
                taskId,
                type: 'AI_ANSWER',
                role: 'ASSISTANT',
                content: aiResponse
            }
        });

        return savedThread;

    } catch (error) {
        console.error('AI Query Failed:', error);
        throw error;
    }
};
