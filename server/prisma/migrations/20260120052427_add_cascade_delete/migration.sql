-- DropForeignKey
ALTER TABLE "AiThread" DROP CONSTRAINT "AiThread_taskId_fkey";

-- AddForeignKey
ALTER TABLE "AiThread" ADD CONSTRAINT "AiThread_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
