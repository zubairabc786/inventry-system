// prisma/config.ts
import { defineDatasource } from "@prisma/client/runtime/library";

export default defineDatasource({
  // For direct MongoDB connection
  adapter: "mongodb",
  url: process.env.DATABASE_URL,

  // OR for Prisma Accelerate
  // accelerateUrl: process.env.DATABASE_URL,
});
