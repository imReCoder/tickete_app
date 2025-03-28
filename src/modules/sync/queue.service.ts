import { Injectable } from '@nestjs/common';
import { IQueueTask, IQueueTaskPayload } from 'src/common/interfaces/sync.interface';

@Injectable()
export class QueueService {
  private taskQueue: IQueueTask[] = [];
  private nextTaskResolver: ((tasks: IQueueTask[]) => void) | null = null;
  private timeout:NodeJS.Timeout;
  public async addToQueue(taskId: string, payload: IQueueTaskPayload) {
    this.taskQueue.push({ taskId, payload });
    this.nextTaskResolver?.(this.taskQueue.splice(0, this.taskQueue.length));
    this.nextTaskResolver = null;
  }

  public async getNextBatch(batchSize: number, timeoutMs: number): Promise<IQueueTask[]> {
    clearTimeout(this.timeout);
    return new Promise((resolve) => {
      this.timeout = setTimeout(() => {
        resolve(this.taskQueue.splice(0, this.taskQueue.length)); // Return whatever is available
        this.nextTaskResolver = null;
      }, timeoutMs);

      this.nextTaskResolver = (tasks) => {
        clearTimeout(this.timeout);
        resolve(tasks.splice(0, batchSize)); 
      };

      if (this.taskQueue.length >= batchSize) {
        this.nextTaskResolver(this.taskQueue);
      }
    });
  }

  public getQueueLength() {
    return this.taskQueue.length;
  }

  public clearQueue(){
    clearTimeout(this.timeout);
    return this.taskQueue.length = 0;
  }
}
