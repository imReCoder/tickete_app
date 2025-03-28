export interface IPrice {
    id: number;
    finalPrice: number;
    currencyCode: string;
    originalPrice: number;
  }
  
  export interface IPaxAvailability {
    type: string;
    name: string;
    description: string;
    min: number;
    max: number;
    remaining: number;
    price: IPrice;
  }
  
  export interface ISlot {
    startTime: string; // e.g., "04:00"
    startDate: string; // e.g., "2025-04-15"
    remaining: number;
    paxAvailibility: IPaxAvailability[];
  }
  