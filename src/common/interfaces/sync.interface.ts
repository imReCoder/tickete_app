import { IProduct } from "./product.interface";

export interface IQueueTask {
  taskId: string;
  payload: IQueueTaskPayload;
}

export interface IQueueTaskPayload {
  product: IProduct;
  date: string;
}
