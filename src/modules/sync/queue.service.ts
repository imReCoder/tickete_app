import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  private taskQueue: { taskId: string; payload: any }[] = [];
  private nextTaskResolver: ((tasks: any[]) => void) | null = null;

  public async addToQueue(taskId: string, payload: any) {
    this.taskQueue.push({ taskId, payload });
    this.nextTaskResolver?.(this.taskQueue.splice(0, this.taskQueue.length));
    this.nextTaskResolver = null;
  }

  public async getNextBatch(batchSize: number, timeoutMs: number): Promise<any[]> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(this.taskQueue.splice(0, this.taskQueue.length)); // Return whatever is available
        this.nextTaskResolver = null;
      }, timeoutMs);

      this.nextTaskResolver = (tasks) => {
        clearTimeout(timeout);
        resolve(tasks.splice(0, batchSize)); // Return only batchSize tasks
      };

      if (this.taskQueue.length >= batchSize) {
        this.nextTaskResolver(this.taskQueue);
      }
    });
  }

  public getQueueLength() {
    return this.taskQueue.length;
  }
}
