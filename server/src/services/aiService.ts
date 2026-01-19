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
        // We don't throw here to ensure the task creation doesn't fail just because AI failed
    }
};
