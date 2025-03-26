import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  private taskQueue: { taskId: string; payload: any }[] = [];
  private nextTaskResolver: ((task: any | null) => void) | null = null;

  public async addToQueue(taskId: string, payload: any) {
    this.taskQueue.push({ taskId, payload });

    if (this.nextTaskResolver) {
      const nextTask = this.taskQueue.shift() || null;
      this.nextTaskResolver(nextTask);
      this.nextTaskResolver = null;
    }
  }

  public async getNextTask(): Promise<any | null> {
    if (this.taskQueue.length > 0) {
      return this.taskQueue.shift();
    }

    // Wait until a new task is added
    return new Promise((resolve) => {
      this.nextTaskResolver = resolve;
    });
  }
}
