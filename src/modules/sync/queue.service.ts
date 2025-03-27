import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  private taskQueue: { taskId: string; payload: any }[] = [];
  private nextTaskResolver: ((tasks: any[]) => void) | null = null;

  public async addToQueue(taskId: string, payload: any) {
    this.taskQueue.push({ taskId, payload });

    if (this.nextTaskResolver) {
      const tasks = this.taskQueue.splice(0, this.taskQueue.length);
      this.nextTaskResolver(tasks);
      this.nextTaskResolver = null;
    }
  }

  public async getNextBatch(batchSize: number, timeoutMs: number): Promise<any[]> {
    // Wait indefinitely if the queue is empty
    while (this.taskQueue.length === 0) {
      await new Promise((resolve) => (this.nextTaskResolver = resolve));
    }

    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkQueue = () => {
        if (this.taskQueue.length >= batchSize) {
          resolve(this.taskQueue.splice(0, batchSize));
          this.nextTaskResolver = null;
        } else if (Date.now() - startTime >= timeoutMs) {
          resolve(this.taskQueue.splice(0, this.taskQueue.length)); // Return all available tasks
          this.nextTaskResolver = null;
        } else {
          setTimeout(checkQueue, 100); // Check every 100ms
        }
      };

      checkQueue();
    });
  }

  public getQueueLength(){
    return this.taskQueue.length;
  }
}
