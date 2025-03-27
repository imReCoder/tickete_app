import { IConfiguration } from "src/common/interfaces/configuration.interface";

export default ():IConfiguration => ({
  port: Number(process.env.PORT) || 3000,
  partnerApi: process.env.PARTNER_API as string,
  partnerApiToken: process.env.PARTNER_API_TOKEN as string,
  rateLimit:Number(process.env.RATE_LIMIT_PER_MINUTE),
  batchSize:Number(process.env.BATCH_SIZE)
});
