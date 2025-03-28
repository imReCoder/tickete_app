import { plainToInstance } from 'class-transformer';

export function convertToDto<T = unknown>(input: any, type: any): T {
  return plainToInstance(type, input, { excludeExtraneousValues: true }) as T;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}

export async function delay(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export  function getTaskId(productId: number, dateString: string) {
  return `${productId}_${dateString}`;
}


export function calculateAdjustedDelay(startTime: number,rateLimitInfo:any): number {
  const processingTime = Date.now() - startTime;
  return Math.max(0, rateLimitInfo.delayPerBatch - processingTime);
}